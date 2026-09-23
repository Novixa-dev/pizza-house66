import { TimeSlotOption } from "@/types";

export interface BusinessHourRecord {
  dayOfWeek: number;
  shiftName: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/**
 * Calculates the earliest possible pickup time (ASAP).
 * Formula: now + prepDuration (15m) + safetyBuffer (5m), rounded up to next 5-minute interval.
 */
export function calculateEarliestPickup(
  now = new Date(),
  prepDurationMinutes = 15,
  safetyBufferMinutes = 5
): Date {
  const totalOffsetMs = (prepDurationMinutes + safetyBufferMinutes) * 60 * 1000;
  const target = new Date(now.getTime() + totalOffsetMs);

  // Round up to nearest 5 minutes
  const minutes = target.getMinutes();
  const remainder = minutes % 5;
  if (remainder !== 0) {
    target.setMinutes(minutes + (5 - remainder));
  }
  target.setSeconds(0);
  target.setMilliseconds(0);
  return target;
}

/**
 * Calculates when the kitchen should begin preparation.
 * Formula: Requested Pickup - prepDuration - buffer
 */
export function calculateKitchenReleaseTime(
  requestedPickupTime: Date,
  prepDurationMinutes = 15,
  safetyBufferMinutes = 5
): Date {
  const releaseMs = (prepDurationMinutes + safetyBufferMinutes) * 60 * 1000;
  return new Date(requestedPickupTime.getTime() - releaseMs);
}

/**
 * Parses time string (e.g. "16:00" or "23:30") into hours and minutes.
 */
function parseTime(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  return { hours: h, minutes: m };
}

/**
 * Generates discrete 15-minute pickup slots for a target date,
 * respecting shift opening hours, current time, and capacity limits.
 */
export function generatePickupSlots({
  targetDate,
  businessHours,
  existingSlotOrdersCount = {},
  slotCapacityMax = 8,
  now = new Date(),
}: {
  targetDate: Date;
  businessHours: BusinessHourRecord[];
  existingSlotOrdersCount?: Record<string, number>;
  slotCapacityMax?: number;
  now?: Date;
}): TimeSlotOption[] {
  const dayOfWeek = targetDate.getDay();
  const dayShifts = businessHours.filter((b) => b.dayOfWeek === dayOfWeek && !b.isClosed);

  if (dayShifts.length === 0) {
    return [];
  }

  const earliestPickup = calculateEarliestPickup(now);
  const isToday =
    targetDate.getFullYear() === now.getFullYear() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getDate() === now.getDate();

  const slots: TimeSlotOption[] = [];
  const seenTimes = new Set<string>();

  for (const shift of dayShifts) {
    const open = parseTime(shift.openTime);
    const close = parseTime(shift.closeTime);

    const shiftStart = new Date(targetDate);
    shiftStart.setHours(open.hours, open.minutes, 0, 0);

    const shiftEnd = new Date(targetDate);
    shiftEnd.setHours(close.hours, close.minutes, 0, 0);

    // Stop taking orders 30 minutes before shift closing
    const lastOrderTime = new Date(shiftEnd.getTime() - 30 * 60 * 1000);

    let currentSlot = new Date(shiftStart);
    // Align currentSlot to 15-minute mark
    const minRemainder = currentSlot.getMinutes() % 15;
    if (minRemainder !== 0) {
      currentSlot.setMinutes(currentSlot.getMinutes() + (15 - minRemainder));
    }

    while (currentSlot <= lastOrderTime) {
      const hours = currentSlot.getHours();
      const minutes = currentSlot.getMinutes();
      const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

      if (!seenTimes.has(timeString)) {
        seenTimes.add(timeString);

        // Format labels in 12-hour format with Arabic & English markers
        const periodAr = hours >= 12 ? "مساءً" : "صباحاً";
        const periodEn = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        const displayMins = String(minutes).padStart(2, "0");

        const displayLabelAr = `${displayHours}:${displayMins} ${periodAr}`;
        const displayLabelEn = `${displayHours}:${displayMins} ${periodEn}`;

        // Validate if in the past
        let isAvailable = true;
        let reason = undefined;

        if (isToday && currentSlot.getTime() < earliestPickup.getTime()) {
          isAvailable = false;
          reason = "وقت مضى / غير متاح";
        }

        // Validate capacity
        const bookedCount = existingSlotOrdersCount[timeString] || 0;
        if (bookedCount >= slotCapacityMax) {
          isAvailable = false;
          reason = "الفرن ممتلئ (اكتملت السعة)";
        }

        slots.push({
          timeString,
          displayLabelAr,
          displayLabelEn,
          isAvailable,
          reason,
        });
      }

      // Increment by 15 minutes
      currentSlot = new Date(currentSlot.getTime() + 15 * 60 * 1000);
    }
  }

  // Sort slots chronologically
  return slots.sort((a, b) => a.timeString.localeCompare(b.timeString));
}

/**
 * Is the restaurant serving at `now`, according to its configured shifts?
 *
 * Handles shifts that run past midnight (e.g. 16:00-00:30): when closeTime is
 * less than or equal to openTime the shift is treated as spilling into the next
 * day, and the check also considers yesterday's spill-over window.
 */
export function isOpenAt(
  businessHours: BusinessHourRecord[],
  now = new Date()
): boolean {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const today = now.getDay();
  const yesterday = (today + 6) % 7;

  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  for (const shift of businessHours) {
    if (shift.isClosed) continue;

    const open = toMinutes(shift.openTime);
    const close = toMinutes(shift.closeTime);
    const wrapsMidnight = close <= open;

    if (!wrapsMidnight) {
      if (shift.dayOfWeek === today && minutesNow >= open && minutesNow < close) {
        return true;
      }
    } else {
      // Evening portion, on the shift's own day.
      if (shift.dayOfWeek === today && minutesNow >= open) return true;
      // Small-hours portion, which belongs to the previous day's shift.
      if (shift.dayOfWeek === yesterday && minutesNow < close) return true;
    }
  }

  return false;
}
