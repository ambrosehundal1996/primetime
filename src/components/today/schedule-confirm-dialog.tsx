"use client";

import { getDurationMinutes } from "@/lib/calendar-layout";
import { formatTime } from "@/lib/dates";
import { formatMinutes } from "@/lib/utils";
import type { PendingScheduleChange } from "./schedule-change-types";
import { ArrowRight, Calendar, X } from "lucide-react";

interface ScheduleConfirmDialogProps {
  change: PendingScheduleChange;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function TimeRange({ start, end }: { start: string; end: string }) {
  const duration = getDurationMinutes(start, end);
  return (
    <span>
      {formatTime(start)} – {formatTime(end)}{" "}
      <span className="text-gray-400">({formatMinutes(duration)})</span>
    </span>
  );
}

function ChangeRow({
  label,
  before,
  after,
}: {
  label: string;
  before?: string;
  after: string;
}) {
  const changed = before !== undefined && before !== after;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      {changed ? (
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-900">
          <span className="line-through text-gray-400">{before}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="font-medium">{after}</span>
        </div>
      ) : (
        <p className="mt-1 text-sm font-medium text-gray-900">{after}</p>
      )}
    </div>
  );
}

export function ScheduleConfirmDialog({
  change,
  loading,
  error,
  onConfirm,
  onCancel,
}: ScheduleConfirmDialogProps) {
  const title =
    change.kind === "update"
      ? change.nextTitle
      : change.kind === "schedule"
        ? change.nextTitle
        : change.taskTitle;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 pr-8">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Confirm calendar change
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Review the change below. Nothing is saved until you confirm.
        </p>

        <div className="mt-5 space-y-3">
          <ChangeRow label="Task" after={title} />

          {change.kind === "schedule" && (
            <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                New Google Calendar event
              </p>
              <p className="mt-1 text-sm font-medium text-green-900">
                <TimeRange start={change.nextStart} end={change.nextEnd} />
              </p>
            </div>
          )}

          {change.kind === "update" && (
            <>
              {change.previousTitle !== change.nextTitle && (
                <ChangeRow
                  label="Title"
                  before={change.previousTitle}
                  after={change.nextTitle}
                />
              )}
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Time on Google Calendar
                </p>
                <div className="mt-1 space-y-1 text-sm">
                  <p className="text-gray-400 line-through">
                    <TimeRange
                      start={change.previousStart}
                      end={change.previousEnd}
                    />
                  </p>
                  <p className="font-medium text-gray-900">
                    <TimeRange start={change.nextStart} end={change.nextEnd} />
                  </p>
                </div>
              </div>
            </>
          )}

          {change.kind === "unschedule" && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-red-700">
                Remove from Google Calendar
              </p>
              <p className="mt-1 text-sm font-medium text-red-900">
                <TimeRange
                  start={change.previousStart}
                  end={change.previousEnd}
                />
              </p>
              <p className="mt-1 text-xs text-red-600">
                The calendar event will be deleted. The task stays in Primetime
                as unscheduled.
              </p>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Confirm"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
