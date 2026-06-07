import { NextRequest, NextResponse } from "next/server";
import { getCalendarEvents, findAvailableSlots } from "@/services/calendar";
import { todayStr } from "@/lib/dates";

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date") ?? todayStr();
    const events = await getCalendarEvents(date);
    const slots = findAvailableSlots(events, date);

    return NextResponse.json({ date, events, available_slots: slots });
  } catch (error) {
    console.error("Calendar error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar" },
      { status: 500 }
    );
  }
}
