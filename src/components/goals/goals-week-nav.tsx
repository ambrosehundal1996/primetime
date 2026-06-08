"use client";

import Link from "next/link";
import {
  addDaysToDateStr,
  formatDate,
  getWeekBoundsForDate,
  isCurrentWeek,
  todayStr,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GoalsWeekNavProps {
  date: string;
}

function buildHref(date: string) {
  return `/goals?week=${date}`;
}

export function GoalsWeekNav({ date }: GoalsWeekNavProps) {
  const week = getWeekBoundsForDate(date);
  const prevWeek = addDaysToDateStr(week.startStr, -7);
  const nextWeek = addDaysToDateStr(week.startStr, 7);
  const today = todayStr();
  const viewingCurrentWeek = isCurrentWeek(date);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weekly Goals</h1>
        <p className="text-sm text-gray-500">
          {formatDate(week.startStr, "MMM d")} –{" "}
          {formatDate(week.endStr, "MMM d, yyyy")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={buildHref(prevWeek)}
          aria-label="Previous week"
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <Link
          href={buildHref(today)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            viewingCurrentWeek
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          This week
        </Link>

        <Link
          href={buildHref(nextWeek)}
          aria-label="Next week"
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>

        {!viewingCurrentWeek && (
          <span className="text-xs text-gray-400 ml-2">
            {date < today ? "Past week" : "Future week"}
          </span>
        )}
      </div>
    </div>
  );
}
