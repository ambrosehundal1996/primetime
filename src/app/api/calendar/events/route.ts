import { NextRequest, NextResponse } from "next/server";
import { getCalendarEvents, findAvailableSlots } from "@/services/calendar";
import { todayStr } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date") ?? todayStr();
    const view = request.nextUrl.searchParams.get("view");

    if (view === "week") {
      const { getWeekBoundsForDate } = await import("@/lib/dates");
      const { getCalendarEventsForRange, groupEventsByDate } = await import(
        "@/services/calendar"
      );
      const week = getWeekBoundsForDate(date);
      const { events, error, configured } = await getCalendarEventsForRange(
        week.startStr,
        week.endStr
      );
      return NextResponse.json({
        date,
        view: "week",
        week,
        events_by_day: groupEventsByDate(events, week.days),
        events,
        error,
        configured,
      });
    }

    const { events, error, configured } = await getCalendarEvents(date);
    const slots = findAvailableSlots(events, date);

    return NextResponse.json({
      date,
      view: "day",
      events,
      available_slots: slots,
      error,
      configured,
    });
  } catch (error) {
    console.error("Calendar error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar" },
      { status: 500 }
    );
  }
}
