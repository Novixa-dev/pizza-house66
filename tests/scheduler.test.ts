import { describe, it, expect } from "vitest";
import {
  calculateEarliestPickup,
  calculateKitchenReleaseTime,
  generatePickupSlots,
  BusinessHourRecord,
} from "@/lib/scheduler";

describe("Scheduler Engine", () => {
  it("calculates earliest pickup with prep duration, safety buffer, and 5-min ceiling rounding", () => {
    // 16:03:00 -> 16:03 + 15m prep + 5m buffer = 16:23 -> rounded to 5m = 16:25
    const baseTime = new Date("2026-09-19T16:03:00");
    const earliest = calculateEarliestPickup(baseTime, 15, 5);

    expect(earliest.getHours()).toBe(16);
    expect(earliest.getMinutes()).toBe(25);
    expect(earliest.getSeconds()).toBe(0);
  });

  it("calculates exact earliest pickup when already on a 5-minute boundary", () => {
    // 17:00:00 -> + 20m = 17:20:00 -> no rounding needed
    const baseTime = new Date("2026-09-19T17:00:00");
    const earliest = calculateEarliestPickup(baseTime, 15, 5);

    expect(earliest.getHours()).toBe(17);
    expect(earliest.getMinutes()).toBe(20);
  });

  it("calculates kitchen release time (T_release = T_pickup - T_prep - buffer)", () => {
    // Pickup: 18:30 -> Prep: 15m + Buffer 5m = 20m -> Release: 18:10
    const pickupTime = new Date("2026-09-19T18:30:00");
    const releaseTime = calculateKitchenReleaseTime(pickupTime, 15, 5);

    expect(releaseTime.getHours()).toBe(18);
    expect(releaseTime.getMinutes()).toBe(10);
  });

  it("generates valid 15-minute pickup slots within shift business hours", () => {
    const targetDate = new Date("2026-09-19T00:00:00"); // Saturday (day 6)
    const dayOfWeek = targetDate.getDay();

    const mockBusinessHours: BusinessHourRecord[] = [
      {
        dayOfWeek,
        shiftName: "Evening",
        openTime: "16:00",
        closeTime: "23:30",
        isClosed: false,
      },
    ];

    // Current time: 14:00 (before shift opens)
    const now = new Date("2026-09-19T14:00:00");

    const slots = generatePickupSlots({
      targetDate,
      businessHours: mockBusinessHours,
      now,
    });

    expect(slots.length).toBeGreaterThan(0);
    // First slot should be 16:00 or 16:15
    expect(slots[0].timeString).toBe("16:00");
    // Last slot should be 30 mins before closeTime (23:30 - 30m = 23:00)
    const lastSlot = slots[slots.length - 1];
    expect(lastSlot.timeString).toBe("23:00");
    expect(slots.every((s) => s.isAvailable)).toBe(true);
  });

  it("marks past slots as unavailable when ordering during shift", () => {
    const targetDate = new Date("2026-09-19T00:00:00");
    const dayOfWeek = targetDate.getDay();

    const mockBusinessHours: BusinessHourRecord[] = [
      {
        dayOfWeek,
        shiftName: "Evening",
        openTime: "16:00",
        closeTime: "23:30",
        isClosed: false,
      },
    ];

    // Current time: 17:35 -> Earliest pickup is ~17:55
    const now = new Date("2026-09-19T17:35:00");

    const slots = generatePickupSlots({
      targetDate,
      businessHours: mockBusinessHours,
      now,
    });

    // 16:00, 16:15, 16:30, 17:00, 17:15, 17:30 should be unavailable
    const slot1600 = slots.find((s) => s.timeString === "16:00");
    expect(slot1600?.isAvailable).toBe(false);

    const slot1800 = slots.find((s) => s.timeString === "18:00");
    expect(slot1800?.isAvailable).toBe(true);
  });

  it("marks slot as unavailable when oven capacity is reached", () => {
    const targetDate = new Date("2026-09-19T00:00:00");
    const dayOfWeek = targetDate.getDay();

    const mockBusinessHours: BusinessHourRecord[] = [
      {
        dayOfWeek,
        shiftName: "Evening",
        openTime: "16:00",
        closeTime: "23:30",
        isClosed: false,
      },
    ];

    const now = new Date("2026-09-19T14:00:00");

    const slots = generatePickupSlots({
      targetDate,
      businessHours: mockBusinessHours,
      existingSlotOrdersCount: {
        "18:00": 8, // Full capacity
      },
      slotCapacityMax: 8,
      now,
    });

    const slot1800 = slots.find((s) => s.timeString === "18:00");
    expect(slot1800?.isAvailable).toBe(false);
    expect(slot1800?.reason).toContain("اكتملت السعة");
  });
});
