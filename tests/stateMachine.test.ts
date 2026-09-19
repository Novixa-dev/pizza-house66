import { describe, it, expect } from "vitest";
import {
  validateOrderTransition,
  isTerminalStatus,
  ORDER_TRANSITION_MAP,
} from "@/lib/stateMachine";

describe("Order State Machine", () => {
  it("allows legal progression through the normal pickup lifecycle", () => {
    // PENDING -> CONFIRMED -> PREPARING -> READY -> COMPLETED
    expect(validateOrderTransition("PENDING", "CONFIRMED", "ADMIN").isValid).toBe(true);
    expect(validateOrderTransition("CONFIRMED", "PREPARING", "KITCHEN").isValid).toBe(true);
    expect(validateOrderTransition("PREPARING", "READY", "KITCHEN").isValid).toBe(true);
    expect(validateOrderTransition("READY", "COMPLETED", "CASHIER").isValid).toBe(true);
  });

  it("allows legal progression through the bank transfer lifecycle", () => {
    // PENDING -> PAYMENT_PENDING -> CONFIRMED / QUEUED -> PREPARING
    expect(validateOrderTransition("PENDING", "PAYMENT_PENDING", "SYSTEM").isValid).toBe(true);
    expect(validateOrderTransition("PAYMENT_PENDING", "CONFIRMED", "CASHIER").isValid).toBe(true);
    expect(validateOrderTransition("PAYMENT_PENDING", "REJECTED", "CASHIER").isValid).toBe(true);
  });

  it("allows queuing scheduled orders", () => {
    expect(validateOrderTransition("PAYMENT_PENDING", "QUEUED", "CASHIER").isValid).toBe(true);
    expect(validateOrderTransition("QUEUED", "PREPARING", "KITCHEN").isValid).toBe(true);
  });

  it("strictly blocks illegal backwards or invalid transitions", () => {
    // COMPLETED -> PREPARING is illegal
    const res1 = validateOrderTransition("COMPLETED", "PREPARING", "ADMIN");
    expect(res1.isValid).toBe(false);
    expect(res1.errorMessage).toContain("غير مسموح");

    // CANCELLED -> READY is illegal
    const res2 = validateOrderTransition("CANCELLED", "READY", "ADMIN");
    expect(res2.isValid).toBe(false);

    // REJECTED -> CONFIRMED is illegal
    const res3 = validateOrderTransition("REJECTED", "CONFIRMED", "ADMIN");
    expect(res3.isValid).toBe(false);

    // PENDING -> READY (skipping cooking) is illegal
    const res4 = validateOrderTransition("PENDING", "READY", "ADMIN");
    expect(res4.isValid).toBe(false);
  });

  it("enforces role permissions on transitions", () => {
    // KITCHEN role cannot review payments (PAYMENT_PENDING -> CONFIRMED)
    const cashierCheck = validateOrderTransition(
      "PAYMENT_PENDING",
      "CONFIRMED",
      "KITCHEN"
    );
    expect(cashierCheck.isValid).toBe(false);
    expect(cashierCheck.errorMessage).toContain("غير مصرح");
  });

  it("identifies terminal states correctly", () => {
    expect(isTerminalStatus("COMPLETED")).toBe(true);
    expect(isTerminalStatus("CANCELLED")).toBe(true);
    expect(isTerminalStatus("REJECTED")).toBe(true);
    expect(isTerminalStatus("PREPARING")).toBe(false);
    expect(isTerminalStatus("CONFIRMED")).toBe(false);
  });
});
