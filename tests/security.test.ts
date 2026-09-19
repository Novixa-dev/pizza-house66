import { describe, it, expect, beforeEach } from "vitest";
import {
  checkPinRateLimit,
  recordFailedPinAttempt,
  resetPinAttempts,
  verifyPinForRole,
} from "@/lib/auth";
import { generatePickupSlots, BusinessHourRecord } from "@/lib/scheduler";

describe("Security & Advanced Edge Cases", () => {
  const testIp = "192.168.1.100";

  beforeEach(() => {
    resetPinAttempts(testIp);
  });

  it("enforces brute-force rate limiting: locks out after 5 consecutive failed attempts", () => {
    // Attempts 1 to 4 should record attempts without locking out
    for (let i = 1; i <= 4; i++) {
      const res = recordFailedPinAttempt(testIp);
      expect(res.isNowLocked).toBe(false);
      expect(res.remainingAttempts).toBe(5 - i);
    }

    // 5th failed attempt triggers 15-minute lockout
    const fifthAttempt = recordFailedPinAttempt(testIp);
    expect(fifthAttempt.isNowLocked).toBe(true);
    expect(fifthAttempt.remainingAttempts).toBe(0);

    // Subsequent check should report locked state
    const lockCheck = checkPinRateLimit(testIp);
    expect(lockCheck.isLocked).toBe(true);
    expect(lockCheck.remainingLockoutMinutes).toBeGreaterThanOrEqual(14);
  });

  it("resets rate limit lockout upon successful authentication", () => {
    recordFailedPinAttempt(testIp);
    recordFailedPinAttempt(testIp);

    // Successful login resets
    resetPinAttempts(testIp);
    expect(checkPinRateLimit(testIp).isLocked).toBe(false);
  });

  it("safely compares PINs with constant-time comparison without throwing", () => {
    expect(verifyPinForRole("1024", "ADMIN").success).toBe(true);
    expect(verifyPinForRole("wrong", "ADMIN").success).toBe(false);
    expect(verifyPinForRole("", "ADMIN").success).toBe(false);
    expect(verifyPinForRole("1024567890", "ADMIN").success).toBe(false);
  });

  it("generates pickup slots for overnight shifts spanning past midnight", () => {
    const targetDate = new Date("2026-09-19T00:00:00");
    const dayOfWeek = targetDate.getDay();

    // Evening shift running 16:00 to 00:30 (crosses midnight)
    const overnightShifts: BusinessHourRecord[] = [
      {
        dayOfWeek,
        shiftName: "Late Night",
        openTime: "16:00",
        closeTime: "00:30",
        isClosed: false,
      },
    ];

    const now = new Date("2026-09-19T14:00:00");
    const slots = generatePickupSlots({
      targetDate,
      businessHours: overnightShifts,
      now,
    });

    expect(slots.length).toBeGreaterThan(0);
    // Should contain slots up to 00:00
    const lateSlot = slots.find((s) => s.timeString === "00:00");
    expect(lateSlot).toBeDefined();
  });
});
