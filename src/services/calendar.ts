import { google } from "googleapis";
import { addMinutes, parseISO, format, isBefore, isAfter } from "date-fns";
import type { CalendarEvent, TimeSlot } from "@/types/database";

const WORK_DAY_START_HOUR = 7;
const WORK_DAY_END_HOUR = 22;
const MIN_SLOT_MINUTES = 30;

function getCalendarClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function getCalendarEvents(
  dateStr: string
): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient();
  if (!calendar) return [];

  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";
  const dayStart = `${dateStr}T00:00:00`;
  const dayEnd = `${dateStr}T23:59:59`;

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date(dayStart).toISOString(),
      timeMax: new Date(dayEnd).toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return (response.data.items ?? []).map((event) => ({
      id: event.id ?? "",
      title: event.summary ?? "Untitled",
      start: event.start?.dateTime ?? event.start?.date ?? "",
      end: event.end?.dateTime ?? event.end?.date ?? "",
      allDay: !event.start?.dateTime,
    }));
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    return [];
  }
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
