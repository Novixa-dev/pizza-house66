import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOpenAt } from "@/lib/scheduler";

/**
 * Live serving status for the header badge and the ordering gate.
 *
 * This lives in a route handler rather than the root layout on purpose: putting
 * a database read in the layout would force every static page to render
 * dynamically. Open/closed is time-sensitive and must never be served from a
 * cached page, so the client asks for it separately.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      select: {
        isOnlineOrderingPaused: true,
        pauseMessageAr: true,
        pauseMessageEn: true,
        businessHours: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json({ isOpen: false, isPaused: true }, { status: 200 });
    }

    return NextResponse.json({
      isOpen: isOpenAt(restaurant.businessHours),
      isPaused: restaurant.isOnlineOrderingPaused,
      pauseMessageAr: restaurant.pauseMessageAr,
      pauseMessageEn: restaurant.pauseMessageEn,
    });
  } catch {
    // Never surface internals; the header simply omits the badge.
    return NextResponse.json({ isOpen: null, isPaused: false }, { status: 200 });
  }
}
