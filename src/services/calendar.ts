import { google } from "googleapis";
import { addMinutes, parseISO, format, isBefore, isAfter } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import type { CalendarEvent, TimeSlot } from "@/types/database";

const WORK_DAY_START_HOUR = 7;
const WORK_DAY_END_HOUR = 22;
const MIN_SLOT_MINUTES = 30;

export type CalendarFetchResult = {
  events: CalendarEvent[];
  error: string | null;
  configured: boolean;
};

function getCalendarTimezone(): string {
  return process.env.CALENDAR_TIMEZONE ?? "America/Los_Angeles";
}

function isCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    !process.env.GOOGLE_CLIENT_ID.includes("your-") &&
    !process.env.GOOGLE_REFRESH_TOKEN.includes("your-")
  );
}

function getDayBoundsUTC(dateStr: string): { timeMin: string; timeMax: string } {
  const tz = getCalendarTimezone();
  const timeMin = fromZonedTime(`${dateStr}T00:00:00`, tz).toISOString();
  const timeMax = fromZonedTime(`${dateStr}T23:59:59.999`, tz).toISOString();
  return { timeMin, timeMax };
}

function getCalendarClient() {
  if (!isCalendarConfigured()) return null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

function mapGoogleEvents(
  items: { id?: string | null; summary?: string | null; start?: { dateTime?: string | null; date?: string | null }; end?: { dateTime?: string | null; date?: string | null } }[]
): CalendarEvent[] {
  return items.map((event) => ({
    id: event.id ?? "",
    title: event.summary ?? "Untitled",
    start: event.start?.dateTime ?? event.start?.date ?? "",
    end: event.end?.dateTime ?? event.end?.date ?? "",
    allDay: !event.start?.dateTime,
  }));
}

function getRangeBoundsUTC(
  startDate: string,
  endDate: string
): { timeMin: string; timeMax: string } {
  const tz = getCalendarTimezone();
  const timeMin = fromZonedTime(`${startDate}T00:00:00`, tz).toISOString();
  const timeMax = fromZonedTime(`${endDate}T23:59:59.999`, tz).toISOString();
  return { timeMin, timeMax };
}

export async function getCalendarEvents(
  dateStr: string
): Promise<CalendarFetchResult> {
  if (!isCalendarConfigured()) {
    return {
      events: [],
      error: "Google Calendar is not configured. Add GOOGLE_* env vars.",
      configured: false,
    };
  }

  const calendar = getCalendarClient();
  if (!calendar) {
    return {
      events: [],
      error: "Failed to initialize Google Calendar client.",
      configured: false,
    };
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";
  const { timeMin, timeMax } = getDayBoundsUTC(dateStr);

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      timeZone: getCalendarTimezone(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return {
      events: mapGoogleEvents(response.data.items ?? []),
      error: null,
      configured: true,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown calendar error";
    console.error("Failed to fetch calendar events:", error);
    return { events: [], error: message, configured: true };
  }
}

export async function getCalendarEventsForRange(
  startDate: string,
  endDate: string
): Promise<CalendarFetchResult> {
  if (!isCalendarConfigured()) {
    return {
      events: [],
      error: "Google Calendar is not configured. Add GOOGLE_* env vars.",
      configured: false,
    };
  }

  const calendar = getCalendarClient();
  if (!calendar) {
    return {
      events: [],
      error: "Failed to initialize Google Calendar client.",
      configured: false,
    };
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";
  const { timeMin, timeMax } = getRangeBoundsUTC(startDate, endDate);

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      timeZone: getCalendarTimezone(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return {
      events: mapGoogleEvents(response.data.items ?? []),
      error: null,
      configured: true,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown calendar error";
    console.error("Failed to fetch calendar events:", error);
    return { events: [], error: message, configured: true };
  }
}

export function eventDateKey(event: CalendarEvent): string {
  if (event.allDay || !event.start.includes("T")) {
    return event.start.slice(0, 10);
  }
  return format(parseISO(event.start), "yyyy-MM-dd");
}

export function groupEventsByDate(
  events: CalendarEvent[],
  days: string[]
): Record<string, CalendarEvent[]> {
  const grouped: Record<string, CalendarEvent[]> = {};
  for (const day of days) grouped[day] = [];

  for (const event of events) {
    const key = eventDateKey(event);
    if (grouped[key]) {
      grouped[key].push(event);
    }
  }

  return grouped;
}

export function findAvailableSlots(
  events: CalendarEvent[],
  dateStr: string,
  minDurationMinutes = MIN_SLOT_MINUTES
): TimeSlot[] {
  const dayStart = parseISO(`${dateStr}T${String(WORK_DAY_START_HOUR).padStart(2, "0")}:00:00`);
  const dayEnd = parseISO(`${dateStr}T${String(WORK_DAY_END_HOUR).padStart(2, "0")}:00:00`);

  const busyBlocks = events
    .filter((e) => !e.allDay && e.start && e.end)
    .map((e) => ({
      start: parseISO(e.start),
      end: parseISO(e.end),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const slots: TimeSlot[] = [];
  let cursor = dayStart;

  for (const block of busyBlocks) {
    if (isBefore(block.start, cursor)) {
      if (isAfter(block.end, cursor)) cursor = block.end;
      continue;
    }

    const gapMinutes = (block.start.getTime() - cursor.getTime()) / 60000;
    if (gapMinutes >= minDurationMinutes) {
      slots.push({
        start: format(cursor, "yyyy-MM-dd'T'HH:mm:ss"),
        end: format(block.start, "yyyy-MM-dd'T'HH:mm:ss"),
        duration_minutes: Math.floor(gapMinutes),
      });
    }
    cursor = block.end;
  }

  const remainingMinutes = (dayEnd.getTime() - cursor.getTime()) / 60000;
  if (remainingMinutes >= minDurationMinutes) {
    slots.push({
      start: format(cursor, "yyyy-MM-dd'T'HH:mm:ss"),
      end: format(dayEnd, "yyyy-MM-dd'T'HH:mm:ss"),
      duration_minutes: Math.floor(remainingMinutes),
    });
  }

  return slots;
}

export function suggestWorkBlocks(
  slots: TimeSlot[],
  estimatedMinutes: number
): TimeSlot[] {
  return slots.filter((s) => s.duration_minutes >= estimatedMinutes);
}

export function hasSchedulingConflict(
  events: CalendarEvent[],
  start: string,
  end: string
): boolean {
  const proposedStart = parseISO(start);
  const proposedEnd = parseISO(end);

  return events.some((event) => {
    if (event.allDay || !event.start || !event.end) return false;
    const eventStart = parseISO(event.start);
    const eventEnd = parseISO(event.end);
    return proposedStart < eventEnd && proposedEnd > eventStart;
  });
}

export function allocateSlot(
  slots: TimeSlot[],
  minutesNeeded: number
): { start: string; end: string } | null {
  const suitable = slots.find((s) => s.duration_minutes >= minutesNeeded);
  if (!suitable) return null;

  const start = parseISO(suitable.start);
  const end = addMinutes(start, minutesNeeded);

  return {
    start: format(start, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    end: format(end, "yyyy-MM-dd'T'HH:mm:ssXXX"),
  };
}
