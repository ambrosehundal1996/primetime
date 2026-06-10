"use client";

import { useState } from "react";
import { parseISO } from "date-fns";
import {
  getDurationMinutes,
  isoToTimeValue,
  timeValueToISO,
} from "@/lib/calendar-layout";
import { formatTime } from "@/lib/dates";
import type { ActionTask } from "@/types/database";
import type { PendingScheduleChange } from "./schedule-change-types";
import { X } from "lucide-react";

interface ScheduledTaskEditDialogProps {
  task: ActionTask;
  date: string;
  onClose: () => void;
  onRequestChange: (change: PendingScheduleChange) => void;
}

export function ScheduledTaskEditDialog({
  task,
  date,
  onClose,
  onRequestChange,
}: ScheduledTaskEditDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(task.title);
  const [startTime, setStartTime] = useState(
    isoToTimeValue(task.scheduled_start!)
  );
  const [endTime, setEndTime] = useState(isoToTimeValue(task.scheduled_end!));

  function handleSave() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const scheduledStart = timeValueToISO(date, startTime);
    const scheduledEnd = timeValueToISO(date, endTime);

    if (parseISO(scheduledEnd) <= parseISO(scheduledStart)) {
      setError("End time must be after start time.");
      return;
    }

    const nextTitle = title.trim();
    const unchanged =
      nextTitle === task.title &&
      scheduledStart === task.scheduled_start &&
      scheduledEnd === task.scheduled_end;

    if (unchanged) {
      onClose();
      return;
    }

    onRequestChange({
      kind: "update",
      taskId: task.id,
      previousTitle: task.title,
      nextTitle,
      previousStart: task.scheduled_start!,
      previousEnd: task.scheduled_end!,
      nextStart: scheduledStart,
      nextEnd: scheduledEnd,
    });
    onClose();
  }

  function handleUnschedule() {
    onRequestChange({
      kind: "unschedule",
      taskId: task.id,
      taskTitle: task.title,
      previousStart: task.scheduled_start!,
      previousEnd: task.scheduled_end!,
    });
    onClose();
  }

  const duration = getDurationMinutes(
    timeValueToISO(date, startTime),
    timeValueToISO(date, endTime)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 pr-8">
          Edit scheduled task
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          You&apos;ll confirm changes before they sync to Google Calendar.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Currently {formatTime(task.scheduled_start!)} –{" "}
            {formatTime(task.scheduled_end!)} · {duration} min
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Review changes
            </button>
            <button
              type="button"
              onClick={handleUnschedule}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Remove from calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
