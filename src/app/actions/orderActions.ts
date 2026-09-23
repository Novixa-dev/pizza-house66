"use server";

import { prisma } from "@/lib/prisma";
import { CreateOrderSchema } from "@/lib/validation";
import { calculateAuthoritativeOrder } from "@/lib/pricing";
import {
  calculateEarliestPickup,
  calculateKitchenReleaseTime,
  generatePickupSlots,
} from "@/lib/scheduler";
import { validateReceiptDataUri } from "@/lib/receipt";
import { canTransition, type StaffRole } from "@/lib/orderState";
import { OrderStatus } from "@/types";
import { revalidatePath } from "next/cache";

/** Customer-facing reasons a receipt was refused. Never leaks internals. */
const RECEIPT_ERRORS: Record<string, string> = {
  MALFORMED: "تعذر قراءة صورة الإشعار. يرجى إرفاقها مرة أخرى.",
  UNSUPPORTED_TYPE: "نوع الملف غير مدعوم. يرجى إرفاق صورة JPG أو PNG أو WEBP.",
  TYPE_MISMATCH: "محتوى الملف لا يطابق نوعه. يرجى إرفاق صورة صالحة.",
  TOO_LARGE: "حجم الصورة يجب ألا يتجاوز 5 ميجابايت.",
};

/**
 * Counts live orders already booked into each HH:mm pickup slot for `day`.
 * Cancelled and rejected orders free their slot back up.
 */
async function countOrdersPerSlot(day: Date): Promise<Record<string, number>> {
  const startOfDay = new Date(day);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(day);
  endOfDay.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      requestedPickupTime: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ["CANCELLED", "REJECTED"] },
    },
    select: { requestedPickupTime: true },
  });

  const counts: Record<string, number> = {};
  for (const o of orders) {
    const h = String(o.requestedPickupTime.getHours()).padStart(2, "0");
    const m = String(o.requestedPickupTime.getMinutes()).padStart(2, "0");
    const key = `${h}:${m}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/**
 * Creates a new order authoritatively on the server.
 */
export async function createOrderAction(rawInput: unknown) {
  try {
    const parseResult = CreateOrderSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.errors.map((e) => e.message).join("، "),
      };
    }

    const data = parseResult.data;

    // 1. Check restaurant status (is ordering paused?)
    const restaurant = await prisma.restaurant.findFirst({
      include: { businessHours: true },
    });

    if (!restaurant) {
      return { success: false, error: "تعذر العثور على بيانات المطعم." };
    }

    if (restaurant.isOnlineOrderingPaused) {
      return {
        success: false,
        error:
          restaurant.pauseMessageAr ||
          "نعتذر، استقبال الطلبات متوقف مؤقتاً لضغط المطبخ.",
      };
    }

    // 2. Authoritatively recalculate financial totals and validate items
    const calculation = await calculateAuthoritativeOrder(data.items);
    if (!calculation.isValid) {
      return { success: false, error: calculation.errorMessage };
    }

    // 3. Determine Pickup & Preparation Release Timings
    const now = new Date();
    let requestedPickupTime: Date;

    if (data.pickupMode === "ASAP") {
      requestedPickupTime = calculateEarliestPickup(
        now,
        restaurant.defaultPrepDuration,
        5
      );
    } else {
      if (!data.requestedTime) {
        return { success: false, error: "يرجى تحديد وقت الاستلام المفضل." };
      }
      // Re-derive the valid slots on the server. The client renders the same
      // list, but a crafted request can name any time at all -- including one
      // when the restaurant is shut or a window that is already full.
      const slotCounts = await countOrdersPerSlot(now);
      const validSlots = generatePickupSlots({
        targetDate: now,
        businessHours: restaurant.businessHours,
        existingSlotOrdersCount: slotCounts,
        slotCapacityMax: restaurant.slotCapacityMax,
        now,
      });

      const match = validSlots.find((s) => s.timeString === data.requestedTime);
      if (!match) {
        return {
          success: false,
          error: "وقت الاستلام المحدد غير متاح. يرجى اختيار وقت آخر.",
        };
      }
      if (!match.isAvailable) {
        return {
          success: false,
          error: match.reason || "وقت الاستلام المحدد لم يعد متاحاً.",
        };
      }

      const [h, m] = data.requestedTime.split(":").map(Number);
      requestedPickupTime = new Date(now);
      requestedPickupTime.setHours(h, m, 0, 0);

      if (requestedPickupTime.getTime() < now.getTime()) {
        return { success: false, error: "وقت الاستلام المحدد قد مضى." };
      }
    }

    // Calculate Planned Prep Start
    const plannedPrepStartTime = calculateKitchenReleaseTime(
      requestedPickupTime,
      restaurant.defaultPrepDuration,
      5
    );

    // 4. Validate the payment receipt before anything is written.
    let receipt: ReturnType<typeof validateReceiptDataUri> | null = null;
    if (data.paymentMethod !== "PAY_AT_PICKUP") {
      receipt = validateReceiptDataUri(data.receiptUrl);
      if (!receipt.ok) {
        return { success: false, error: RECEIPT_ERRORS[receipt.reason] };
      }
    }

    // Initial status:
    // If Pay at Pickup: CONFIRMED (or QUEUED if scheduled for later)
    // If Bank Transfer: PAYMENT_PENDING until verified
    let initialStatus = "CONFIRMED";
    let paymentStatus = "UNPAID";

    if (data.paymentMethod !== "PAY_AT_PICKUP") {
      initialStatus = "PAYMENT_PENDING";
      paymentStatus = "PENDING_VERIFICATION";
    } else {
      // If pickup is more than 30 mins in future, queue it
      if (plannedPrepStartTime.getTime() > now.getTime()) {
        initialStatus = "QUEUED";
      }
    }

    // 5. Atomic transaction creating order, items, options, and payment
    const newOrder = await prisma.$transaction(async (tx) => {
      // Generated INSIDE the transaction. Computed outside it, two concurrent
      // checkouts read the same count and produced the same number, and one
      // failed on the unique constraint.
      const count = await tx.order.count();
      const orderNumber = `#PH-${1024 + count}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          restaurantId: restaurant.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          pickupMode: data.pickupMode,
          requestedPickupTime,
          plannedPrepStartTime,
          status: initialStatus,
          subtotal: calculation.subtotal,
          discount: calculation.discount,
          total: calculation.total,
          notes: data.notes,
          items: {
            create: calculation.items.map((item) => ({
              productId: item.productId,
              productNameAr: item.productNameAr,
              productNameEn: item.productNameEn,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
              itemNotes: item.notes,
              options: {
                create: item.selectedOptions.map((opt) => ({
                  groupNameAr: opt.groupNameAr,
                  groupNameEn: opt.groupNameEn,
                  nameAr: opt.nameAr,
                  nameEn: opt.nameEn,
                  priceDelta: opt.priceDelta,
                })),
              },
            })),
          },
          payment: {
            create: {
              method: data.paymentMethod,
              status: paymentStatus,
              amount: calculation.total,
              referenceNumber: data.referenceNumber,
              receipt:
                receipt && receipt.ok
                  ? {
                      create: {
                        fileUrl: receipt.dataUri,
                        // Measured from the payload, not claimed by the client.
                        fileName: receipt.fileName,
                        mimeType: receipt.mimeType,
                        fileSize: receipt.fileSize,
                      },
                    }
                  : undefined,
            },
          },
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actor: data.customerName,
          action: "ORDER_CREATED",
          entity: "Order",
          entityId: order.id,
          metadata: JSON.stringify({
            orderNumber: order.orderNumber,
            total: calculation.total,
            pickupMode: data.pickupMode,
            paymentMethod: data.paymentMethod,
          }),
        },
      });

      return order;
    });

    revalidatePath("/kitchen");
    revalidatePath("/admin");

    return {
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      trackingToken: newOrder.trackingToken,
    };
  } catch (error) {
    console.error("Failed to create order:", error);
    return { success: false, error: "حدث خطأ غير متوقع أثناء معالجة الطلب." };
  }
}

/**
 * Updates an order status with state machine safeguards.
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
  actor = "staff",
  // TODO(auth): this role must come from the authenticated session once staff
  // authentication exists. Until then the guard enforces the transition graph
  // but cannot prove who the caller is -- see docs/SECURITY.md.
  role: StaffRole = "MANAGER"
) {
  try {
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return { success: false, error: "الطلب غير موجود." };
    }

    // Reject illegal jumps (e.g. straight to COMPLETED) and any change to an
    // order that has already reached a terminal state.
    const check = canTransition(existing.status, newStatus, role);
    if (!check.allowed) {
      return {
        success: false,
        error:
          check.reason === "TERMINAL"
            ? "لا يمكن تعديل حالة طلب منتهٍ."
            : "لا يمكن الانتقال إلى هذه الحالة.",
      };
    }

    const updates: Record<string, unknown> = { status: newStatus };

    if (newStatus === "PREPARING" && !existing.actualPrepStartTime) {
      updates.actualPrepStartTime = new Date();
    } else if (newStatus === "READY" && !existing.readyTime) {
      updates.readyTime = new Date();
    } else if (newStatus === "COMPLETED" && !existing.completedTime) {
      updates.completedTime = new Date();
    }

    await prisma.order.update({
      where: { id: orderId },
      data: updates,
    });

    await prisma.auditLog.create({
      data: {
        actor,
        action: `STATUS_CHANGED_TO_${newStatus}`,
        entity: "Order",
        entityId: orderId,
        metadata: JSON.stringify({
          previousStatus: existing.status,
          newStatus,
        }),
      },
    });

    revalidatePath("/kitchen");
    revalidatePath("/admin");
    revalidatePath(`/track/${orderId}`);

    return { success: true };
  } catch (err) {
    console.error("Failed to update order status:", err);
    return { success: false, error: "تعذر تحديث حالة الطلب." };
  }
}

/**
 * Approves or rejects an uploaded bank transfer receipt.
 */
export async function verifyPaymentAction(
  orderId: string,
  isApproved: boolean,
  rejectReason?: string,
  reviewer = "الكاشير"
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order || !order.payment) {
      return { success: false, error: "بيانات الدفع غير متوفرة." };
    }

    const now = new Date();

    if (isApproved) {
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: "VERIFIED",
          verifiedAt: now,
          verifiedBy: reviewer,
          rejectReason: null,
        },
      });

      // Update order status: If scheduled for later, QUEUED; otherwise, CONFIRMED
      const nextStatus =
        order.plannedPrepStartTime.getTime() > now.getTime()
          ? "QUEUED"
          : "CONFIRMED";

      await prisma.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
      });
    } else {
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: "REJECTED",
          rejectReason: rejectReason || "الإشعار غير مطابق أو غير واضح.",
          verifiedAt: now,
          verifiedBy: reviewer,
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: { status: "REJECTED" },
      });
    }

    await prisma.auditLog.create({
      data: {
        actor: reviewer,
        action: isApproved ? "PAYMENT_APPROVED" : "PAYMENT_REJECTED",
        entity: "Payment",
        entityId: order.payment.id,
        metadata: JSON.stringify({ orderId, isApproved, rejectReason }),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/kitchen");
    revalidatePath(`/track/${orderId}`);

    return { success: true };
  } catch (err) {
    console.error("Failed to verify payment:", err);
    return { success: false, error: "تعذر استكمال مراجعة الدفع." };
  }
}

/**
 * Manager control: Toggles paused online ordering.
 */
export async function togglePauseOrderingAction(
  isPaused: boolean,
  messageAr?: string
) {
  try {
    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) return { success: false, error: "المطعم غير موجود." };

    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        isOnlineOrderingPaused: isPaused,
        pauseMessageAr: messageAr,
      },
    });

    revalidatePath("/");
    revalidatePath("/menu");
    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error("Failed to toggle pause:", err);
    return { success: false, error: "تعذر تحديث حالة استقبال الطلبات." };
  }
}

/**
 * Manager control: Quick toggle product availability (Available vs Sold Out).
 */
export async function toggleProductAvailabilityAction(
  productId: string,
  isAvailable: boolean
) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { isAvailable },
    });

    revalidatePath("/menu");
    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error("Failed to toggle product availability:", err);
    return { success: false, error: "تعذر تحديث حالة الصنف." };
  }
}
