import { describe, it, expect } from "vitest";
import {
  canTransition,
  allowedNextStatuses,
  isTerminal,
  TERMINAL_STATUSES,
} from "@/lib/orderState";

describe("canTransition — the happy path", () => {
  it("walks a pay-at-pickup order through its normal lifecycle", () => {
    expect(canTransition("PENDING", "CONFIRMED", "CASHIER").allowed).toBe(true);
    expect(canTransition("CONFIRMED", "QUEUED", "MANAGER").allowed).toBe(true);
    expect(canTransition("QUEUED", "PREPARING", "KITCHEN").allowed).toBe(true);
    expect(canTransition("PREPARING", "READY", "KITCHEN").allowed).toBe(true);
    expect(canTransition("READY", "COMPLETED", "CASHIER").allowed).toBe(true);
  });

  it("walks a transfer order through payment verification", () => {
    expect(canTransition("PENDING", "PAYMENT_PENDING", "CASHIER").allowed).toBe(true);
    expect(canTransition("PAYMENT_PENDING", "QUEUED", "CASHIER").allowed).toBe(true);
    expect(canTransition("PAYMENT_PENDING", "REJECTED", "CASHIER").allowed).toBe(true);
  });

  it("allows food to be sent back to the oven", () => {
    // A real kitchen event; forcing a cancel-and-recreate would lose history.
    expect(canTransition("READY", "PREPARING", "KITCHEN").allowed).toBe(true);
  });
});

describe("canTransition — refusals", () => {
  it("refuses a jump straight to COMPLETED", () => {
    // The exact attack the old code allowed: any status string was written.
    const result = canTransition("PENDING", "COMPLETED", "MANAGER");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("ILLEGAL_TRANSITION");
  });

  it("refuses skipping preparation", () => {
    expect(canTransition("QUEUED", "READY", "KITCHEN").reason).toBe("ILLEGAL_TRANSITION");
    expect(canTransition("CONFIRMED", "COMPLETED", "MANAGER").reason).toBe("ILLEGAL_TRANSITION");
  });

  it("refuses moving backwards", () => {
    expect(canTransition("READY", "QUEUED", "KITCHEN").reason).toBe("ILLEGAL_TRANSITION");
    expect(canTransition("PREPARING", "CONFIRMED", "MANAGER").reason).toBe("ILLEGAL_TRANSITION");
  });

  it.each(TERMINAL_STATUSES)("refuses any change out of %s", (terminal) => {
    expect(canTransition(terminal, "PREPARING", "OWNER").reason).toBe("TERMINAL");
    expect(canTransition(terminal, "CANCELLED", "OWNER").reason).toBe("TERMINAL");
  });

  it("refuses unknown status strings from either side", () => {
    expect(canTransition("NOT_A_STATUS", "READY", "KITCHEN").reason).toBe("UNKNOWN_STATUS");
    expect(canTransition("READY", "DELIVERED", "KITCHEN").reason).toBe("UNKNOWN_STATUS");
    expect(canTransition("", "", "OWNER").reason).toBe("UNKNOWN_STATUS");
  });
});

describe("canTransition — role enforcement", () => {
  it("refuses when no role is supplied", () => {
    // An unauthenticated caller must never be able to move an order.
    const result = canTransition("QUEUED", "PREPARING");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("FORBIDDEN_ROLE");
  });

  it("stops kitchen staff cancelling orders or touching payment", () => {
    expect(canTransition("QUEUED", "CANCELLED", "KITCHEN").reason).toBe("FORBIDDEN_ROLE");
    expect(canTransition("PENDING", "PAYMENT_PENDING", "KITCHEN").reason).toBe("FORBIDDEN_ROLE");
    expect(canTransition("PAYMENT_PENDING", "REJECTED", "KITCHEN").reason).toBe("FORBIDDEN_ROLE");
  });

  it("stops cashiers driving the kitchen", () => {
    expect(canTransition("QUEUED", "PREPARING", "CASHIER").reason).toBe("FORBIDDEN_ROLE");
    expect(canTransition("PREPARING", "READY", "CASHIER").reason).toBe("FORBIDDEN_ROLE");
  });

  it("only lets owners and managers cancel", () => {
    expect(canTransition("QUEUED", "CANCELLED", "OWNER").allowed).toBe(true);
    expect(canTransition("QUEUED", "CANCELLED", "MANAGER").allowed).toBe(true);
    expect(canTransition("QUEUED", "CANCELLED", "CASHIER").reason).toBe("FORBIDDEN_ROLE");
  });
});

describe("allowedNextStatuses", () => {
  it("gives the kitchen exactly one forward action on a queued order", () => {
    expect(allowedNextStatuses("QUEUED", "KITCHEN")).toEqual(["PREPARING"]);
  });

  it("gives a manager both the forward and the cancel path", () => {
    expect(allowedNextStatuses("QUEUED", "MANAGER").sort()).toEqual(
      ["CANCELLED", "PREPARING"].sort()
    );
  });

  it("returns nothing from a terminal state", () => {
    expect(allowedNextStatuses("COMPLETED", "OWNER")).toEqual([]);
    expect(allowedNextStatuses("CANCELLED", "OWNER")).toEqual([]);
  });

  it("returns nothing for an unknown state", () => {
    expect(allowedNextStatuses("BOGUS", "OWNER")).toEqual([]);
  });
});

describe("isTerminal", () => {
  it("identifies finished orders", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
    expect(isTerminal("REJECTED")).toBe(true);
  });

  it("identifies in-flight orders", () => {
    expect(isTerminal("QUEUED")).toBe(false);
    expect(isTerminal("READY")).toBe(false);
  });

  it("treats an unknown status as non-terminal rather than throwing", () => {
    expect(isTerminal("BOGUS")).toBe(false);
  });
});
