import { describe, it, expect } from "vitest";
import {
  createStaffToken,
  verifyStaffToken,
  verifyPinForRole,
} from "@/lib/auth";

describe("Staff Authentication & Token Security", () => {
  it("creates and verifies valid signed staff tokens", () => {
    const adminToken = createStaffToken("ADMIN");
    const verified = verifyStaffToken(adminToken);

    expect(verified.isValid).toBe(true);
    expect(verified.role).toBe("ADMIN");

    const kitchenToken = createStaffToken("KITCHEN");
    const verifiedKitchen = verifyStaffToken(kitchenToken);
    expect(verifiedKitchen.isValid).toBe(true);
    expect(verifiedKitchen.role).toBe("KITCHEN");
  });

  it("detects tampered or forged tokens and rejects them", () => {
    const originalToken = createStaffToken("KITCHEN");
    // Attempt privilege escalation by editing role in token string
    const tampered = originalToken.replace("KITCHEN", "ADMIN");

    const verified = verifyStaffToken(tampered);
    expect(verified.isValid).toBe(false);
  });

  it("rejects garbage or malformed tokens", () => {
    expect(verifyStaffToken("").isValid).toBe(false);
    expect(verifyStaffToken("random-string").isValid).toBe(false);
    expect(verifyStaffToken("ADMIN:123").isValid).toBe(false);
  });

  it("verifies staff PIN correctly according to role", () => {
    // Admin default PIN: 1024
    expect(verifyPinForRole("1024", "ADMIN").success).toBe(true);
    // Kitchen default PIN: 2048
    expect(verifyPinForRole("2048", "KITCHEN").success).toBe(true);
    // Admin PIN unlocks Kitchen as well
    expect(verifyPinForRole("1024", "KITCHEN").success).toBe(true);

    // Wrong PIN
    expect(verifyPinForRole("0000", "ADMIN").success).toBe(false);
    expect(verifyPinForRole("2048", "ADMIN").success).toBe(false); // Kitchen cannot unlock Admin
  });
});
