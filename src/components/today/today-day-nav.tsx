"use client";

import Link from "next/link";
import {
  addDaysToDateStr,
  formatDate,
  isToday,
  todayStr,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TodayDayNavProps {
  date: string;
}

function buildHref(date: string) {
  return `/today?date=${date}`;
}

export function TodayDayNav({ date }: TodayDayNavProps) {
  const prevDay = addDaysToDateStr(date, -1);
  const nextDay = addDaysToDateStr(date, 1);
  const today = todayStr();
  const viewingToday = isToday(date);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Today</h1>
        <p className="text-sm text-gray-500">
          {formatDate(date, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={buildHref(prevDay)}
          aria-label="Previous day"
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <Link
          href={buildHref(today)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            viewingToday
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          Today
        </Link>

        <Link
          href={buildHref(nextDay)}
          aria-label="Next day"
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>

        {!viewingToday && (
          <span className="text-xs text-gray-400 ml-2">
            {date < today ? "Past day" : "Future day"}
          </span>
        )}
      </div>
    </div>
  );
}
