import { addMinutes, differenceInMinutes, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { getAppTimezone } from "@/lib/dates";

export const WORK_DAY_START_HOUR = 7;
export const WORK_DAY_END_HOUR = 22;
export const SLOT_MINUTES = 30;

export function getDayStart(dateStr: string): Date {
  return fromZonedTime(
    `${dateStr}T${String(WORK_DAY_START_HOUR).padStart(2, "0")}:00:00`,
    getAppTimezone()
  );
}

export function getDayEnd(dateStr: string): Date {
  return fromZonedTime(
    `${dateStr}T${String(WORK_DAY_END_HOUR).padStart(2, "0")}:00:00`,
    getAppTimezone()
  );
}

export function getWorkDayDurationMinutes(): number {
  return (WORK_DAY_END_HOUR - WORK_DAY_START_HOUR) * 60;
}

export function getTimeSlotLabels(): { hour: number; minute: number; label: string }[] {
  const slots: { hour: number; minute: number; label: string }[] = [];
  for (let hour = WORK_DAY_START_HOUR; hour < WORK_DAY_END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      const h12 = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";
      const minLabel = minute === 0 ? "" : `:${String(minute).padStart(2, "0")}`;
      slots.push({
        hour,
        minute,
        label: `${h12}${minLabel} ${ampm}`,
      });
    }
  }
  return slots;
}

export function slotToISO(dateStr: string, hour: number, minute: number): string {
  const local = `${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  return fromZonedTime(local, getAppTimezone()).toISOString();
}

export function blockPositionStyle(
  dateStr: string,
  startIso: string,
  endIso: string
): { top: string; height: string } {
  const dayStart = getDayStart(dateStr);
  const totalMinutes = getWorkDayDurationMinutes();
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  const topMinutes = Math.max(0, differenceInMinutes(start, dayStart));
  const durationMinutes = Math.max(
    15,
    Math.min(differenceInMinutes(end, start), totalMinutes - topMinutes)
  );

  return {
    top: `${(topMinutes / totalMinutes) * 100}%`,
    height: `${(durationMinutes / totalMinutes) * 100}%`,
  };
}

export function scheduleEndFromStart(
  startIso: string,
  estimatedMinutes: number | null
): string {
  const duration = estimatedMinutes && estimatedMinutes > 0 ? estimatedMinutes : 30;
  return addMinutes(parseISO(startIso), duration).toISOString();
}

export function toGoogleDateTime(iso: string): string {
  return formatInTimeZone(parseISO(iso), getAppTimezone(), "yyyy-MM-dd'T'HH:mm:ss");
}
