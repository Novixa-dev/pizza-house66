/**
 * Pizza House Order State Machine
 * Authoritative, deterministic lifecycle and transition rules.
 */

export type OrderStatus =
  | "PENDING"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "QUEUED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export interface StateTransitionRule {
  allowedNextStates: OrderStatus[];
  allowedRoles: ("CUSTOMER" | "KITCHEN" | "CASHIER" | "ADMIN" | "SYSTEM")[];
  description: string;
}

export const ORDER_TRANSITION_MAP: Record<OrderStatus, StateTransitionRule> = {
  PENDING: {
    allowedNextStates: ["CONFIRMED", "PAYMENT_PENDING", "CANCELLED", "REJECTED"],
    allowedRoles: ["SYSTEM", "CASHIER", "ADMIN"],
    description: "الطلب قيد المعالجة الأولية",
  },
  PAYMENT_PENDING: {
    allowedNextStates: ["CONFIRMED", "QUEUED", "REJECTED", "CANCELLED"],
    allowedRoles: ["CASHIER", "ADMIN", "SYSTEM"],
    description: "بانتظار مراجعة إشعار التحويل المالي",
  },
  QUEUED: {
    allowedNextStates: ["PREPARING", "CANCELLED"],
    allowedRoles: ["KITCHEN", "ADMIN", "SYSTEM"],
    description: "طلب مجدول بانتظار موعد الإطلاق للفرن",
  },
  CONFIRMED: {
    allowedNextStates: ["QUEUED", "PREPARING", "CANCELLED"],
    allowedRoles: ["KITCHEN", "ADMIN", "SYSTEM"],
    description: "تم تأكيد الطلب وجاهز للتنفيذ",
  },
  PREPARING: {
    allowedNextStates: ["READY", "CANCELLED"],
    allowedRoles: ["KITCHEN", "ADMIN"],
    description: "في الفرن - جاري العجن والخبز",
  },
  READY: {
    allowedNextStates: ["COMPLETED"],
    allowedRoles: ["KITCHEN", "CASHIER", "ADMIN"],
    description: "ساخن وجاهز للتسليم في الفرع",
  },
  COMPLETED: {
    allowedNextStates: [], // Terminal state
    allowedRoles: [],
    description: "تم التسليم بنجاح",
  },
  CANCELLED: {
    allowedNextStates: [], // Terminal state
    allowedRoles: [],
    description: "تم إلغاء الطلب",
  },
  REJECTED: {
    allowedNextStates: [], // Terminal state
    allowedRoles: [],
    description: "تم رفض الطلب أو الإشعار",
  },
};

export interface TransitionValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validates whether transitioning an order from currentStatus to nextStatus is permissible.
 */
export function validateOrderTransition(
  currentStatus: string,
  nextStatus: string,
  actorRole: "CUSTOMER" | "KITCHEN" | "CASHIER" | "ADMIN" | "SYSTEM" = "ADMIN"
): TransitionValidationResult {
  const current = currentStatus as OrderStatus;
  const next = nextStatus as OrderStatus;

  const rule = ORDER_TRANSITION_MAP[current];
  if (!rule) {
    return {
      isValid: false,
      errorMessage: `حالة الطلب الحالية غير معترف بها: ${currentStatus}`,
    };
  }

  // Same status transition is a no-op (safe)
  if (current === next) {
    return { isValid: true };
  }

  // Check if target status is in the allowed transition list
  if (!rule.allowedNextStates.includes(next)) {
    return {
      isValid: false,
      errorMessage: `لا يمكن نقل الطلب من حالة "${current}" إلى حالة "${next}". هذا الانتقال غير مسموح برمجياً.`,
    };
  }

  // Check if role is authorized to perform this transition
  if (!rule.allowedRoles.includes(actorRole) && actorRole !== "ADMIN") {
    return {
      isValid: false,
      errorMessage: `الدور الحالي (${actorRole}) غير مصرح له بتغيير الحالة إلى "${next}".`,
    };
  }

  return { isValid: true };
}

/**
 * Helper to check if a status is terminal.
 */
export function isTerminalStatus(status: string): boolean {
  return ["COMPLETED", "CANCELLED", "REJECTED"].includes(status);
}
