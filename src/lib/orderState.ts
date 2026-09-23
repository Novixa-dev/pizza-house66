import type { OrderStatus } from "@/types";

/**
 * The order state machine.
 *
 * Previously `updateOrderStatusAction` wrote whatever string it was handed,
 * so a crafted request could move an order straight to COMPLETED, or revive a
 * cancelled one. This module is the single source of truth for what may
 * follow what, and which role may perform it.
 */

export type StaffRole = "OWNER" | "MANAGER" | "CASHIER" | "KITCHEN";

/** Terminal states: nothing may follow them. */
export const TERMINAL_STATUSES: OrderStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
];

/**
 * Legal transitions, keyed by the current status.
 *
 * Notes on the shape of this graph:
 * - PAYMENT_PENDING can only advance once payment is verified, which is why it
 *   leads to CONFIRMED/QUEUED rather than straight into the kitchen.
 * - QUEUED -> PREPARING is the scheduled-release edge: a future order waits in
 *   QUEUED until its planned prep time arrives.
 * - READY -> PREPARING exists deliberately: food sent back to the oven is a
 *   real kitchen event, and forcing staff to cancel and re-enter would lose
 *   the order's history.
 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAYMENT_PENDING", "CONFIRMED", "QUEUED", "CANCELLED", "REJECTED"],
  PAYMENT_PENDING: ["CONFIRMED", "QUEUED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["QUEUED", "PREPARING", "CANCELLED"],
  QUEUED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "PREPARING"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

/**
 * Which roles may move an order INTO a given status.
 *
 * Kitchen staff drive preparation but must not touch money or cancel an order;
 * cashiers resolve payment; managers and owners can do both.
 */
const PERMITTED_ROLES: Record<OrderStatus, StaffRole[]> = {
  PENDING: [],
  PAYMENT_PENDING: ["OWNER", "MANAGER", "CASHIER"],
  CONFIRMED: ["OWNER", "MANAGER", "CASHIER"],
  QUEUED: ["OWNER", "MANAGER", "CASHIER"],
  PREPARING: ["OWNER", "MANAGER", "KITCHEN"],
  READY: ["OWNER", "MANAGER", "KITCHEN"],
  COMPLETED: ["OWNER", "MANAGER", "CASHIER", "KITCHEN"],
  CANCELLED: ["OWNER", "MANAGER"],
  REJECTED: ["OWNER", "MANAGER", "CASHIER"],
};

export type TransitionRefusal =
  | "UNKNOWN_STATUS"
  | "TERMINAL"
  | "ILLEGAL_TRANSITION"
  | "FORBIDDEN_ROLE";

export interface TransitionCheck {
  allowed: boolean;
  reason?: TransitionRefusal;
}

function isOrderStatus(value: string): value is OrderStatus {
  return Object.prototype.hasOwnProperty.call(TRANSITIONS, value);
}

/**
 * Decides whether `from -> to` is permitted for `role`.
 *
 * Both arguments are typed as plain strings because they arrive from the
 * database (SQLite has no enums) and from the client, neither of which can be
 * trusted to hold a valid member of the union.
 */
export function canTransition(
  from: string,
  to: string,
  role?: StaffRole
): TransitionCheck {
  if (!isOrderStatus(from) || !isOrderStatus(to)) {
    return { allowed: false, reason: "UNKNOWN_STATUS" };
  }
  if (TERMINAL_STATUSES.includes(from)) {
    return { allowed: false, reason: "TERMINAL" };
  }
  if (!TRANSITIONS[from].includes(to)) {
    return { allowed: false, reason: "ILLEGAL_TRANSITION" };
  }
  // A role is required: an unauthenticated caller can never move an order.
  if (!role || !PERMITTED_ROLES[to].includes(role)) {
    return { allowed: false, reason: "FORBIDDEN_ROLE" };
  }
  return { allowed: true };
}

/** The statuses `role` may move an order at `from` into. Drives staff UI. */
export function allowedNextStatuses(
  from: string,
  role: StaffRole
): OrderStatus[] {
  if (!isOrderStatus(from)) return [];
  return TRANSITIONS[from].filter((to) => PERMITTED_ROLES[to].includes(role));
}

export function isTerminal(status: string): boolean {
  return isOrderStatus(status) && TERMINAL_STATUSES.includes(status);
}
