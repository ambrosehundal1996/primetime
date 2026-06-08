"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  addDaysToDateStr,
  formatDate,
  getWeekBoundsForDate,
  isToday,
  todayStr,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CalendarViewMode = "day" | "week";

interface CalendarNavProps {
  date: string;
  view: CalendarViewMode;
}

function buildHref(date: string, view: CalendarViewMode) {
  return `/calendar?date=${date}&view=${view}`;
}

export function CalendarNav({ date, view }: CalendarNavProps) {
  const searchParams = useSearchParams();
  const currentView = (searchParams.get("view") as CalendarViewMode) ?? view;

  const prevDate =
    currentView === "week"
      ? addDaysToDateStr(getWeekBoundsForDate(date).startStr, -7)
      : addDaysToDateStr(date, -1);

  const nextDate =
    currentView === "week"
      ? addDaysToDateStr(getWeekBoundsForDate(date).startStr, 7)
      : addDaysToDateStr(date, 1);

  const today = todayStr();
  const weekBounds = getWeekBoundsForDate(date);

  const title =
    currentView === "week"
      ? `${formatDate(weekBounds.startStr, "MMM d")} – ${formatDate(weekBounds.endStr, "MMM d, yyyy")}`
      : formatDate(date, "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500">{title}</p>
        </div>

        <div className="flex rounded-lg border border-gray-200 p-0.5">
          <ViewToggle date={date} view="day" current={currentView} />
          <ViewToggle date={date} view="week" current={currentView} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NavButton href={buildHref(prevDate, currentView)} label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </NavButton>

        <Link
          href={buildHref(today, currentView)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            isToday(date) || (currentView === "week" && weekBounds.days.includes(today))
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          Today
        </Link>

        <NavButton href={buildHref(nextDate, currentView)} label="Next">
          <ChevronRight className="h-4 w-4" />
        </NavButton>

        {currentView === "day" && !isToday(date) && date < today && (
          <span className="text-xs text-gray-400 ml-2">Past day</span>
        )}
      </div>
    </div>
  );
}

function ViewToggle({
  date,
  view,
  current,
}: {
  date: string;
  view: CalendarViewMode;
  current: CalendarViewMode;
}) {
  return (
    <Link
      href={`/calendar?date=${date}&view=${view}`}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        current === view
          ? "bg-gray-900 text-white"
          : "text-gray-500 hover:text-gray-800"
      )}
    >
      {view === "day" ? "Day" : "Week"}
    </Link>
  );
}

function NavButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
    >
      {children}
    </Link>
  );
}
