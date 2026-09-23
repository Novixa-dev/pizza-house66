import { describe, it, expect } from "vitest";
import {
  isOpenAt,
  calculateEarliestPickup,
  calculateKitchenReleaseTime,
  type BusinessHourRecord,
} from "@/lib/scheduler";

/**
 * The seeded pattern: mornings 08:00-12:00 every day except Friday, evenings
 * 16:00-23:30 every day. Day 5 is Friday.
 */
const standardHours: BusinessHourRecord[] = [];
for (let d = 0; d < 7; d++) {
  if (d !== 5) {
    standardHours.push({
      dayOfWeek: d, shiftName: "Morning",
      openTime: "08:00", closeTime: "12:00", isClosed: false,
    });
  }
  standardHours.push({
    dayOfWeek: d, shiftName: "Evening",
    openTime: "16:00", closeTime: "23:30", isClosed: false,
  });
}

/** A shift running past midnight, e.g. Wednesday 20:00 -> Thursday 02:00. */
const wrappingHours: BusinessHourRecord[] = [
  { dayOfWeek: 3, shiftName: "Late", openTime: "20:00", closeTime: "02:00", isClosed: false },
];

describe("isOpenAt", () => {
  // 2026-09-23 is a Wednesday; 2026-09-25 is a Friday.
  it.each([
    ["2026-09-23T03:01", false, "small hours, nothing open"],
    ["2026-09-23T09:00", true, "inside the morning shift"],
    ["2026-09-23T14:00", false, "the gap between shifts"],
    ["2026-09-23T18:00", true, "inside the evening shift"],
  ])("%s -> %s (%s)", (iso, expected) => {
    expect(isOpenAt(standardHours, new Date(iso as string))).toBe(expected);
  });

  it("treats openTime as inclusive and closeTime as exclusive", () => {
    // A customer arriving exactly at closing time is not served.
    expect(isOpenAt(standardHours, new Date("2026-09-23T16:00"))).toBe(true);
    expect(isOpenAt(standardHours, new Date("2026-09-23T23:29"))).toBe(true);
    expect(isOpenAt(standardHours, new Date("2026-09-23T23:30"))).toBe(false);
    expect(isOpenAt(standardHours, new Date("2026-09-23T12:00"))).toBe(false);
  });

  it("respects a day with no morning shift (Friday)", () => {
    expect(isOpenAt(standardHours, new Date("2026-09-25T09:00"))).toBe(false);
    expect(isOpenAt(standardHours, new Date("2026-09-25T18:00"))).toBe(true);
  });

  it("handles a shift that runs past midnight", () => {
    // Evening portion, on the shift's own day.
    expect(isOpenAt(wrappingHours, new Date("2026-09-23T21:00"))).toBe(true);
    // Small-hours portion belongs to the previous day's shift.
    expect(isOpenAt(wrappingHours, new Date("2026-09-24T01:00"))).toBe(true);
    // After it closes.
    expect(isOpenAt(wrappingHours, new Date("2026-09-24T03:00"))).toBe(false);
    // Before it opens.
    expect(isOpenAt(wrappingHours, new Date("2026-09-23T19:00"))).toBe(false);
  });

  it("is closed when a shift is explicitly marked closed", () => {
    const closed: BusinessHourRecord[] = [
      { dayOfWeek: 3, shiftName: "Evening", openTime: "16:00", closeTime: "23:30", isClosed: true },
    ];
    expect(isOpenAt(closed, new Date("2026-09-23T18:00"))).toBe(false);
  });

  it("is closed when no hours are configured at all", () => {
    expect(isOpenAt([], new Date("2026-09-23T18:00"))).toBe(false);
  });
});

describe("calculateEarliestPickup", () => {
  it("adds prep time plus the safety buffer and rounds up to 5 minutes", () => {
    // 17:30 + 15 prep + 5 buffer = 17:50, already on a 5-minute mark.
    const result = calculateEarliestPickup(new Date("2026-09-23T17:30"), 15, 5);
    expect(result.getHours()).toBe(17);
    expect(result.getMinutes()).toBe(50);
  });

  it("rounds up to the next 5-minute mark", () => {
    // 17:32 + 20 = 17:52 -> rounds to 17:55.
    const result = calculateEarliestPickup(new Date("2026-09-23T17:32"), 15, 5);
    expect(result.getMinutes()).toBe(55);
  });

  it("honours a longer configured prep time", () => {
    // The PRD's worked example: 17:30 with 25 minutes prep.
    const result = calculateEarliestPickup(new Date("2026-09-23T17:30"), 25, 0);
    expect(result.getHours()).toBe(17);
    expect(result.getMinutes()).toBe(55);
  });

  it("zeroes seconds and milliseconds so slots compare cleanly", () => {
    const result = calculateEarliestPickup(new Date("2026-09-23T17:30:42.500"), 15, 5);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

describe("calculateKitchenReleaseTime", () => {
  it("works back from the pickup time, not forward from order time", () => {
    // The core product rule: ordering at 16:00 for 19:00 pickup with 25
    // minutes prep must release to the kitchen at 18:35, not at 16:00.
    const pickup = new Date("2026-09-23T19:00");
    const release = calculateKitchenReleaseTime(pickup, 25, 0);
    expect(release.getHours()).toBe(18);
    expect(release.getMinutes()).toBe(35);
  });

  it("includes the safety buffer", () => {
    const pickup = new Date("2026-09-23T20:00");
    const release = calculateKitchenReleaseTime(pickup, 15, 5);
    expect(release.getHours()).toBe(19);
    expect(release.getMinutes()).toBe(40);
  });

  it("is the inverse of the earliest-pickup calculation", () => {
    const now = new Date("2026-09-23T17:30");
    const pickup = calculateEarliestPickup(now, 15, 5);
    const release = calculateKitchenReleaseTime(pickup, 15, 5);
    // Releasing at or after 'now' means the order can start immediately.
    expect(release.getTime()).toBeGreaterThanOrEqual(now.getTime());
  });
});
