"use server";

import { prisma } from "@/lib/prisma";
import { CreateOrderSchema } from "@/lib/validation";
import { calculateAuthoritativeOrder } from "@/lib/pricing";
import {
  calculateEarliestPickup,
  calculateKitchenReleaseTime,
} from "@/lib/scheduler";
import { validateOrderTransition, OrderStatus } from "@/lib/stateMachine";
import {
  isAuthorizedStaff,
  verifyPinForRole,
  setStaffSessionCookie,
  clearStaffSessionCookie,
  getStaffSession,
  StaffRole,
} from "@/lib/auth";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

/**
 * Saves a base64 data URI receipt to disk safely.
 * Returns the public relative URL or null if invalid.
 */
async function saveReceiptImage(base64DataUri?: string): Promise<{
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
} | null> {
  if (!base64DataUri || !base64DataUri.startsWith("data:image/")) {
    return null;
  }

  try {
    const match = base64DataUri.match(/^data:(image\/(jpeg|png|webp|jpg));base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
    const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const buffer = Buffer.from(match[3], "base64");

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "receipts");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fileName = `receipt_${uniqueId}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    return {
      fileUrl: `/uploads/receipts/${fileName}`,
      fileName,
      mimeType,
      fileSize: buffer.length,
    };
  } catch (err) {
    console.error("Failed to save receipt image to disk:", err);
    return null;
  }
}

/**
 * Generates a collision-free human-readable order number.
 */
async function generateOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  let candidate = `#PH-${1024 + count}`;

  const exists = await prisma.order.findUnique({
    where: { orderNumber: candidate },
  });

  if (!exists) {
    return candidate;
  }

  // Fallback if collision occurs (e.g. concurrent inserts)
  const randomSalt = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `#PH-${1024 + count}-${randomSalt}`;
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

    // 2. Authoritatively recalculate financial totals and validate items & options
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

    // Calculate Planned Prep Start (Release Time)
    const plannedPrepStartTime = calculateKitchenReleaseTime(
      requestedPickupTime,
      restaurant.defaultPrepDuration,
      5
    );

    // 4. Save receipt image to disk if uploaded
    const savedReceipt = await saveReceiptImage(data.receiptUrl);

    // Initial status determined deterministically
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

    // 5. Generate unique human-readable Order Number
    const orderNumber = await generateOrderNumber();

    // 6. Atomic transaction creating order, items, options, and payment
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
              receipt: savedReceipt
                ? {
                    create: {
                      fileUrl: savedReceipt.fileUrl,
                      fileName: savedReceipt.fileName,
                      mimeType: savedReceipt.mimeType,
                      fileSize: savedReceipt.fileSize,
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
 * Updates an order status with strict state machine and role authorization safeguards.
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
  actor = "staff"
) {
  try {
    // 1. Authorization check: Staff must be authenticated
    const session = getStaffSession();
    if (!session.isAuthenticated || !session.role) {
      return {
        success: false,
        error: "غير مصرح لك بتغيير حالة الطلب. يرجى تسجيل الدخول برمز الموظف.",
      };
    }

    // 2. Fetch existing order
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return { success: false, error: "الطلب غير موجود." };
    }

    // 3. State machine validation
    const transitionCheck = validateOrderTransition(
      existing.status,
      newStatus,
      session.role
    );
    if (!transitionCheck.isValid) {
      return {
        success: false,
        error: transitionCheck.errorMessage || "الانتقال بين الحالات غير مسموح.",
      };
    }

    // 4. Update timestamps appropriately
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

    // 5. Audit Log
    await prisma.auditLog.create({
      data: {
        actor: `${actor} (${session.role})`,
        action: `STATUS_CHANGED_TO_${newStatus}`,
        entity: "Order",
        entityId: orderId,
        metadata: JSON.stringify({
          previousStatus: existing.status,
          newStatus,
          role: session.role,
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
 * Restricted to CASHIER or ADMIN roles.
 */
export async function verifyPaymentAction(
  orderId: string,
  isApproved: boolean,
  rejectReason?: string,
  reviewer = "الكاشير"
) {
  try {
    // 1. Authorization check
    const session = getStaffSession();
    if (
      !session.isAuthenticated ||
      !session.role ||
      !["ADMIN", "CASHIER"].includes(session.role)
    ) {
      return {
        success: false,
        error: "غير مصرح لك بمراجعة المدفوعات. يلزم صلاحية الكاشير أو الإدارة.",
      };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order || !order.payment) {
      return { success: false, error: "بيانات الدفع غير متوفرة." };
    }

    // Prevent re-verifying already finalized payments
    if (order.payment.status === "VERIFIED" && isApproved) {
      return { success: false, error: "تم تأكيد هذا الإشعار مسبقاً." };
    }

    const now = new Date();

    if (isApproved) {
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: "VERIFIED",
          verifiedAt: now,
          verifiedBy: `${reviewer} (${session.role})`,
          rejectReason: null,
        },
      });

      // Update order status: If scheduled for later, QUEUED; otherwise, CONFIRMED
      const nextStatus =
        order.plannedPrepStartTime.getTime() > now.getTime()
          ? "QUEUED"
          : "CONFIRMED";

      // Validate state transition
      const check = validateOrderTransition(order.status, nextStatus, session.role);
      if (check.isValid) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: nextStatus },
        });
      }
    } else {
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: "REJECTED",
          rejectReason: rejectReason || "الإشعار غير مطابق أو غير واضح.",
          verifiedAt: now,
          verifiedBy: `${reviewer} (${session.role})`,
        },
      });

      const check = validateOrderTransition(order.status, "REJECTED", session.role);
      if (check.isValid) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "REJECTED" },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actor: `${reviewer} (${session.role})`,
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
 * Restricted to ADMIN role.
 */
export async function togglePauseOrderingAction(
  isPaused: boolean,
  messageAr?: string
) {
  try {
    const session = getStaffSession();
    if (!session.isAuthenticated || session.role !== "ADMIN") {
      return {
        success: false,
        error: "غير مصرح لك بإيقاف استقبال الطلبات. يلزم صلاحية مدير النظام.",
      };
    }

    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) return { success: false, error: "المطعم غير موجود." };

    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        isOnlineOrderingPaused: isPaused,
        pauseMessageAr: messageAr,
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: `Admin (${session.role})`,
        action: isPaused ? "ORDERING_PAUSED" : "ORDERING_RESUMED",
        entity: "Restaurant",
        entityId: restaurant.id,
        metadata: JSON.stringify({ isPaused, messageAr }),
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
 * Manager/Kitchen control: Quick toggle product availability (Available vs Sold Out).
 * Restricted to ADMIN or KITCHEN role.
 */
export async function toggleProductAvailabilityAction(
  productId: string,
  isAvailable: boolean
) {
  try {
    const session = getStaffSession();
    if (
      !session.isAuthenticated ||
      !session.role ||
      !["ADMIN", "KITCHEN"].includes(session.role)
    ) {
      return {
        success: false,
        error: "غير مصرح لك بتعديل توفر الأصناف في القائمة.",
      };
    }

    await prisma.product.update({
      where: { id: productId },
      data: { isAvailable },
    });

    await prisma.auditLog.create({
      data: {
        actor: `Staff (${session.role})`,
        action: isAvailable ? "PRODUCT_AVAILABLE" : "PRODUCT_86ED",
        entity: "Product",
        entityId: productId,
        metadata: JSON.stringify({ isAvailable }),
      },
    });

    revalidatePath("/menu");
    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error("Failed to toggle product availability:", err);
    return { success: false, error: "تعذر تحديث حالة الصنف." };
  }
}

/**
 * Staff authentication action via PIN.
 */
export async function loginStaffAction(pin: string, targetRole: StaffRole) {
  try {
    const verification = verifyPinForRole(pin, targetRole);
    if (!verification.success || !verification.role) {
      return {
        success: false,
        error: "الرمز السري المدخل غير صحيح.",
      };
    }

    setStaffSessionCookie(verification.role);

    return {
      success: true,
      role: verification.role,
    };
  } catch (err) {
    console.error("Staff login failed:", err);
    return { success: false, error: "تعذر تسجيل الدخول." };
  }
}

/**
 * Staff logout action.
 */
export async function logoutStaffAction() {
  try {
    clearStaffSessionCookie();
    revalidatePath("/admin");
    revalidatePath("/kitchen");
    return { success: true };
  } catch (err) {
    console.error("Staff logout failed:", err);
    return { success: false, error: "تعذر تسجيل الخروج." };
  }
}
