import { Suspense } from "react";
import {
  getCalendarEvents,
  getCalendarEventsForRange,
  findAvailableSlots,
  groupEventsByDate,
} from "@/services/calendar";
import {
  todayStr,
  getWeekBoundsForDate,
  isToday,
} from "@/lib/dates";
import { CalendarView } from "@/components/calendar/calendar-view";
import { CalendarWeekView } from "@/components/calendar/calendar-week-view";
import { CalendarNav, type CalendarViewMode } from "@/components/calendar/calendar-nav";

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  searchParams: Promise<{ date?: string; view?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const view = (params.view === "week" ? "week" : "day") as CalendarViewMode;
  const date = params.date ?? todayStr();

  if (view === "week") {
    const week = getWeekBoundsForDate(date);
    const { events, error, configured } = await getCalendarEventsForRange(
      week.startStr,
      week.endStr
    );
    const eventsByDay = groupEventsByDate(events, week.days);

    return (
      <div className="p-6 max-w-7xl space-y-6">
        <Suspense fallback={null}>
          <CalendarNav date={date} view={view} />
        </Suspense>

        {error && <CalendarError error={error} configured={configured} />}

        <CalendarWeekView days={week.days} eventsByDay={eventsByDay} />
      </div>
    );
  }

  const { events, error, configured } = await getCalendarEvents(date);
  const slots = findAvailableSlots(events, date);

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <Suspense fallback={null}>
        <CalendarNav date={date} view={view} />
      </Suspense>

      {error && <CalendarError error={error} configured={configured} />}

      {isToday(date) ? null : (
        <p className="text-xs text-gray-400">
          Viewing {date}. Use arrows or Today to navigate.
        </p>
      )}

      <CalendarView
        date={date}
        events={events}
        availableSlots={slots}
        error={null}
        configured={configured}
      />
    </div>
  );
}

function CalendarError({
  error,
  configured,
}: {
  error: string;
  configured: boolean;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <p className="font-medium">Calendar connection issue</p>
      <p className="mt-1 text-amber-700">{error}</p>
      {!configured && (
        <p className="mt-2 text-xs text-amber-600">
          See docs/GOOGLE_CALENDAR_SETUP.md for setup steps.
        </p>
      )}
    </div>
  );
}
