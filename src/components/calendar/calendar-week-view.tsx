import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatTime, isToday } from "@/lib/dates";
import { formatMinutes } from "@/lib/utils";
import { findAvailableSlots } from "@/services/calendar";
import type { CalendarEvent } from "@/types/database";
import { cn } from "@/lib/utils";

interface CalendarWeekViewProps {
  days: string[];
  eventsByDay: Record<string, CalendarEvent[]>;
}

export function CalendarWeekView({ days, eventsByDay }: CalendarWeekViewProps) {
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((day) => {
        const events = eventsByDay[day] ?? [];
        const slots = findAvailableSlots(events, day);
        const today = isToday(day);

        return (
          <div
            key={day}
            className={cn(
              "rounded-xl border p-3 min-h-[180px]",
              today
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 bg-white"
            )}
          >
            <Link
              href={`/calendar?date=${day}&view=day`}
              className="block mb-3 group"
            >
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  today ? "text-gray-900" : "text-gray-500"
                )}
              >
                {formatDate(day, "EEE")}
              </p>
              <p
                className={cn(
                  "text-lg font-bold group-hover:underline",
                  today ? "text-gray-900" : "text-gray-700"
                )}
              >
                {formatDate(day, "d")}
              </p>
            </Link>

            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-xs text-gray-400">No events</p>
              ) : (
                events.slice(0, 4).map((event) => (
                  <Card key={event.id} className="border-gray-100 shadow-none">
                    <CardContent className="p-2">
                      <p className="text-xs font-medium text-gray-900 line-clamp-2">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {event.allDay
                          ? "All day"
                          : formatTime(event.start)}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
              {events.length > 4 && (
                <Link
                  href={`/calendar?date=${day}&view=day`}
                  className="text-[10px] text-gray-500 hover:text-gray-800"
                >
                  +{events.length - 4} more
                </Link>
              )}
            </div>

            {slots.length > 0 && (
              <p className="mt-2 text-[10px] font-medium text-green-600">
                {slots.length} open slot{slots.length !== 1 ? "s" : ""} ·{" "}
                {formatMinutes(
                  slots.reduce((s, sl) => s + sl.duration_minutes, 0)
                )}{" "}
                free
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
