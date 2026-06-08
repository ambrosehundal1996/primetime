import { getCalendarEvents, findAvailableSlots } from "@/services/calendar";
import { todayStr } from "@/lib/dates";
import { CalendarView } from "@/components/calendar/calendar-view";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const date = todayStr();
  const { events, error, configured } = await getCalendarEvents(date);
  const slots = findAvailableSlots(events, date);

  return (
    <div className="p-6 max-w-5xl">
      <CalendarView
        date={date}
        events={events}
        availableSlots={slots}
        error={error}
        configured={configured}
      />
    </div>
  );
}
