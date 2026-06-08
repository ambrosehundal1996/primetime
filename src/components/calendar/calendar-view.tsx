import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime, formatDate } from "@/lib/dates";
import { formatMinutes } from "@/lib/utils";
import type { CalendarEvent, TimeSlot } from "@/types/database";
import { Calendar, Clock } from "lucide-react";

interface CalendarViewProps {
  date: string;
  events: CalendarEvent[];
  availableSlots: TimeSlot[];
  error?: string | null;
  configured?: boolean;
}

export function CalendarView({
  date,
  events,
  availableSlots,
  error,
  configured = true,
}: CalendarViewProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        {events.length} events · {availableSlots.length} open slots
      </p>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Calendar connection issue</p>
          <p className="mt-1 text-amber-700">{error}</p>
          {!configured && (
            <p className="mt-2 text-xs text-amber-600">
              See docs/GOOGLE_CALENDAR_SETUP.md for setup steps.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Calendar className="h-4 w-4" />
            Calendar Events
          </h3>
          {events.length === 0 ? (
            <p className="text-sm text-gray-400">No events today</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <Card key={event.id} className="border-gray-100">
                  <CardContent className="py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {event.allDay
                        ? "All day"
                        : `${formatTime(event.start)} – ${formatTime(event.end)}`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Clock className="h-4 w-4" />
            Available Slots
          </h3>
          {availableSlots.length === 0 ? (
            <p className="text-sm text-gray-400">No open time slots</p>
          ) : (
            <div className="space-y-2">
              {availableSlots.map((slot, i) => (
                <Card
                  key={i}
                  className="border-green-100 bg-green-50/50"
                >
                  <CardContent className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatTime(slot.start)} – {formatTime(slot.end)}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-green-600">
                      {formatMinutes(slot.duration_minutes)} free
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
