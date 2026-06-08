import {
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  differenceInDays,
  addDays,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";

function getAppTimezone(): string {
  return process.env.CALENDAR_TIMEZONE ?? "America/Los_Angeles";
}

function nowInAppTimezone(): Date {
  return toZonedTime(new Date(), getAppTimezone());
}

export function getWeekBounds(date: Date = nowInAppTimezone()): {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
} {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return {
    start,
    end,
    startStr: format(start, "yyyy-MM-dd"),
    endStr: format(end, "yyyy-MM-dd"),
  };
}

export function todayStr(): string {
  return format(nowInAppTimezone(), "yyyy-MM-dd");
}

export function formatDate(date: string | Date, fmt = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), "h:mm a");
}

export function daysRemainingInWeek(date: Date = new Date()): number {
  const { end } = getWeekBounds(date);
  return Math.max(0, differenceInDays(end, date));
}

export function daysElapsedInWeek(date: Date = new Date()): number {
  const { start } = getWeekBounds(date);
  return differenceInDays(date, start) + 1;
}

export function isDateInWeek(dateStr: string, weekStart: string, weekEnd: string): boolean {
  const date = parseISO(dateStr);
  return isWithinInterval(date, {
    start: parseISO(weekStart),
    end: parseISO(weekEnd),
  });
}

export function getDayBounds(dateStr: string): { start: Date; end: Date } {
  const date = parseISO(dateStr);
  return { start: startOfDay(date), end: endOfDay(date) };
}

export function getWeekDays(weekStart: string): string[] {
  const start = parseISO(weekStart);
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
}

export function getWeekBoundsForDate(dateStr: string): {
  startStr: string;
  endStr: string;
  days: string[];
} {
  const bounds = getWeekBounds(parseISO(dateStr));
  return {
    startStr: bounds.startStr,
    endStr: bounds.endStr,
    days: getWeekDays(bounds.startStr),
  };
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  return format(addDays(parseISO(dateStr), days), "yyyy-MM-dd");
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

export function isPastDate(dateStr: string): boolean {
  return dateStr < todayStr();
}
