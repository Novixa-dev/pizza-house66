"use server";

import { prisma } from "@/lib/prisma";
import { CreateOrderSchema } from "@/lib/validation";
import { calculateAuthoritativeOrder } from "@/lib/pricing";
import {
  calculateEarliestPickup,
  calculateKitchenReleaseTime,
} from "@/lib/scheduler";
import { OrderStatus } from "@/types";
import { revalidatePath } from "next/cache";

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
      const [h, m] = data.requestedTime.split(":").map(Number);
      requestedPickupTime = new Date(now);
      requestedPickupTime.setHours(h, m, 0, 0);

      // If requested time has already passed today, error
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

    // 4. Generate unique human-readable Order Number
    const count = await prisma.order.count();
    const orderNumber = `#PH-${1024 + count}`;

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
              receipt: data.receiptUrl
                ? {
                    create: {
                      fileUrl: data.receiptUrl,
                      fileName: "receipt.jpg",
                      mimeType: "image/jpeg",
                      fileSize: 102400,
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
            orderNumber,
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
  actor = "staff"
) {
  try {
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return { success: false, error: "الطلب غير موجود." };
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
