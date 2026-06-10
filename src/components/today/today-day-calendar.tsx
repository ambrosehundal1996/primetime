"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMinutes, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  scheduleTaskToCalendarAction,
  updateScheduledTaskAction,
  unscheduleTaskAction,
} from "@/actions/tasks";
import {
  blockPositionStyle,
  getDurationMinutes,
  getTimeSlotLabels,
  getWorkDayDurationMinutes,
  scheduleEndFromStart,
  slotToISO,
  WORK_DAY_START_HOUR,
} from "@/lib/calendar-layout";
import { formatMinutes } from "@/lib/utils";
import { getAppTimezoneLabel } from "@/lib/dates";
import type { ActionTask, CalendarEvent } from "@/types/database";
import { Calendar, GripVertical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScheduledTaskBlock } from "./scheduled-task-block";
import { ScheduledTaskEditDialog } from "./scheduled-task-edit-dialog";
import { ScheduleConfirmDialog } from "./schedule-confirm-dialog";
import type { PendingScheduleChange } from "./schedule-change-types";

interface TodayDayCalendarProps {
  date: string;
  events: CalendarEvent[];
  tasks: ActionTask[];
  calendarError?: string | null;
  calendarConfigured?: boolean;
}

const DRAG_TYPE = "application/primetime-task";

function isSchedulable(task: ActionTask): boolean {
  return !["completed", "missed", "skipped"].includes(task.status);
}

export function TodayDayCalendar({
  date,
  events,
  tasks,
  calendarError,
  calendarConfigured = true,
}: TodayDayCalendarProps) {
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<ActionTask | null>(null);
  const [pendingChange, setPendingChange] =
    useState<PendingScheduleChange | null>(null);
  const [blockPreviews, setBlockPreviews] = useState<
    Record<string, { start: string; end: string }>
  >({});

  const linkedEventIds = useMemo(
    () => new Set(tasks.map((t) => t.google_event_id).filter(Boolean)),
    [tasks]
  );

  const externalEvents = useMemo(
    () => events.filter((e) => !linkedEventIds.has(e.id)),
    [events, linkedEventIds]
  );

  const schedulableTasks = useMemo(
    () => tasks.filter(isSchedulable),
    [tasks]
  );

  const unscheduledTasks = useMemo(
    () => schedulableTasks.filter((t) => !t.scheduled_start),
    [schedulableTasks]
  );

  const scheduledTasks = useMemo(
    () =>
      schedulableTasks.filter(
        (t) => t.scheduled_start && t.scheduled_end
      ),
    [schedulableTasks]
  );

  const timeSlots = getTimeSlotLabels();

  function requestChange(change: PendingScheduleChange) {
    setConfirmError(null);
    setActionError(null);
    setPendingChange(change);

    if (change.kind !== "unschedule") {
      setBlockPreviews((prev) => ({
        ...prev,
        [change.taskId]: {
          start: change.nextStart,
          end: change.nextEnd,
        },
      }));
    }
  }

  function cancelPendingChange() {
    if (pendingChange && pendingChange.kind !== "unschedule") {
      setBlockPreviews((prev) => {
        const next = { ...prev };
        delete next[pendingChange.taskId];
        return next;
      });
    }
    setPendingChange(null);
    setConfirmError(null);
  }

  function confirmPendingChange() {
    if (!pendingChange) return;

    setConfirmError(null);
    startTransition(async () => {
      let result: { success: boolean; error?: string };

      if (pendingChange.kind === "schedule") {
        result = await scheduleTaskToCalendarAction(
          pendingChange.taskId,
          date,
          pendingChange.nextStart,
          pendingChange.nextEnd
        );
      } else if (pendingChange.kind === "update") {
        result = await updateScheduledTaskAction(
          pendingChange.taskId,
          date,
          pendingChange.nextStart,
          pendingChange.nextEnd,
          pendingChange.nextTitle
        );
      } else {
        result = await unscheduleTaskAction(pendingChange.taskId);
      }

      if (!result.success) {
        setConfirmError(result.error ?? "Failed to apply change.");
        return;
      }

      setBlockPreviews((prev) => {
        const next = { ...prev };
        delete next[pendingChange.taskId];
        return next;
      });
      setPendingChange(null);
      router.refresh();
    });
  }

  function handleDragStart(task: ActionTask, e: React.DragEvent) {
    setDraggingTaskId(task.id);
    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ taskId: task.id }));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDraggingTaskId(null);
    setDragOverSlot(null);
  }

  function handleDrop(
    hour: number,
    minute: number,
    e: React.DragEvent<HTMLDivElement>
  ) {
    e.preventDefault();
    setDragOverSlot(null);
    setDraggingTaskId(null);

    const raw = e.dataTransfer.getData(DRAG_TYPE);
    if (!raw) return;

    let taskId: string;
    try {
      taskId = JSON.parse(raw).taskId;
    } catch {
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const nextStart = slotToISO(date, hour, minute);
    let nextEnd: string;

    if (task.scheduled_start && task.scheduled_end) {
      const duration = getDurationMinutes(
        task.scheduled_start,
        task.scheduled_end
      );
      nextEnd = addMinutes(parseISO(nextStart), duration).toISOString();
    } else {
      nextEnd = scheduleEndFromStart(nextStart, task.estimated_minutes);
    }

    if (task.scheduled_start && task.scheduled_end) {
      if (
        nextStart === task.scheduled_start &&
        nextEnd === task.scheduled_end
      ) {
        return;
      }
      requestChange({
        kind: "update",
        taskId: task.id,
        previousTitle: task.title,
        nextTitle: task.title,
        previousStart: task.scheduled_start,
        previousEnd: task.scheduled_end,
        nextStart,
        nextEnd,
      });
      return;
    }

    requestChange({
      kind: "schedule",
      taskId: task.id,
      taskTitle: task.title,
      nextTitle: task.title,
      nextStart,
      nextEnd,
    });
  }

  function handleBlockCommit(
    taskId: string,
    nextStart: string,
    nextEnd: string
  ) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.scheduled_start || !task.scheduled_end) return;

    if (
      nextStart === task.scheduled_start &&
      nextEnd === task.scheduled_end
    ) {
      setBlockPreviews((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      return;
    }

    requestChange({
      kind: "update",
      taskId: task.id,
      previousTitle: task.title,
      nextTitle: task.title,
      previousStart: task.scheduled_start,
      previousEnd: task.scheduled_end,
      nextStart,
      nextEnd,
    });
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Day schedule</h2>
        </div>
        <p className="text-xs text-gray-400">
          Drag to move · resize · click to edit · {getAppTimezoneLabel()}
        </p>
      </div>

      {(calendarError || actionError) && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p>{actionError ?? calendarError}</p>
          {!calendarConfigured && !actionError && (
            <p className="mt-1 text-xs text-amber-600">
              See docs/GOOGLE_CALENDAR_SETUP.md for setup steps.
            </p>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-[220px_1fr]">
        <div className="border-b lg:border-b-0 lg:border-r border-gray-100 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Drag to schedule
          </p>
          {unscheduledTasks.length === 0 ? (
            <p className="text-xs text-gray-400">
              All tasks are scheduled or done.
            </p>
          ) : (
            <div className="space-y-2">
              {unscheduledTasks.map((task) => (
                <div
                  key={task.id}
                  draggable={!pendingChange}
                  onDragStart={(e) => handleDragStart(task, e)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 cursor-grab active:cursor-grabbing transition-opacity",
                    draggingTaskId === task.id && "opacity-40",
                    (pending || pendingChange) && "pointer-events-none opacity-60"
                  )}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-gray-300 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 line-clamp-2">
                      {task.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <Badge variant="priority" value={task.priority}>
                        {task.priority}
                      </Badge>
                      {task.estimated_minutes && (
                        <span className="text-[10px] text-gray-400">
                          {formatMinutes(task.estimated_minutes)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pending && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Syncing with Google Calendar…
            </p>
          )}
        </div>

        <div className="relative p-4">
          <div
            ref={gridRef}
            className="relative h-[640px] rounded-lg border border-gray-100 bg-gray-50/50"
          >
            <div className="absolute inset-0">
              {timeSlots.map((slot) => {
                const slotKey = `${slot.hour}-${slot.minute}`;
                const isHourMark = slot.minute === 0;
                return (
                  <div
                    key={slotKey}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverSlot(slotKey);
                    }}
                    onDragLeave={() => setDragOverSlot(null)}
                    onDrop={(e) => handleDrop(slot.hour, slot.minute, e)}
                    className={cn(
                      "absolute left-0 right-0 border-t transition-colors",
                      isHourMark ? "border-gray-200" : "border-gray-100",
                      dragOverSlot === slotKey && "bg-blue-100/60"
                    )}
                    style={{
                      top: `${((slot.hour - WORK_DAY_START_HOUR) * 60 + slot.minute) / getWorkDayDurationMinutes() * 100}%`,
                      height: `${(30 / getWorkDayDurationMinutes()) * 100}%`,
                    }}
                  >
                    {isHourMark && (
                      <span className="absolute -top-2.5 left-1 text-[10px] font-medium text-gray-400 bg-gray-50/80 px-1">
                        {slot.label}
                      </span>
                    )}
                  </div>
                );
              })}

              {externalEvents
                .filter((e) => !e.allDay && e.start && e.end)
                .map((event) => {
                  const style = blockPositionStyle(date, event.start, event.end);
                  return (
                    <div
                      key={event.id}
                      className="absolute left-14 right-2 rounded-md border border-blue-200 bg-blue-50/90 px-2 py-1 overflow-hidden pointer-events-none z-10"
                      style={style}
                    >
                      <p className="text-[11px] font-medium text-blue-900 truncate">
                        {event.title}
                      </p>
                    </div>
                  );
                })}

              {scheduledTasks.map((task) => {
                const preview = blockPreviews[task.id];
                const isPendingPreview =
                  pendingChange?.taskId === task.id &&
                  pendingChange.kind !== "unschedule";
                return (
                  <ScheduledTaskBlock
                    key={task.id}
                    task={task}
                    date={date}
                    gridRef={gridRef}
                    disabled={pending || Boolean(pendingChange)}
                    previewStart={preview?.start}
                    previewEnd={preview?.end}
                    isPendingConfirm={isPendingPreview}
                    onPreviewChange={(next) => {
                      if (pendingChange) return;
                      setBlockPreviews((prev) => {
                        if (!next) {
                          const copy = { ...prev };
                          delete copy[task.id];
                          return copy;
                        }
                        return { ...prev, [task.id]: next };
                      });
                    }}
                    onCommit={handleBlockCommit}
                    onEdit={setEditingTask}
                  />
                );
              })}

              {pendingChange?.kind === "schedule" &&
                blockPreviews[pendingChange.taskId] && (
                  <div
                    className="absolute left-14 right-2 rounded-md border-2 border-dashed border-gray-600 bg-gray-900/80 px-2 py-1 overflow-hidden z-20 pointer-events-none"
                    style={blockPositionStyle(
                      date,
                      blockPreviews[pendingChange.taskId].start,
                      blockPreviews[pendingChange.taskId].end
                    )}
                  >
                    <p className="text-[11px] font-medium text-white truncate">
                      {pendingChange.nextTitle}
                    </p>
                    <p className="text-[10px] text-gray-300">Pending confirm</p>
                  </div>
                )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-blue-200 bg-blue-50" />
              Google Calendar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-gray-900" />
              Scheduled tasks
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border-2 border-dashed border-gray-600 bg-gray-900/80" />
              Pending confirmation
            </span>
          </div>
        </div>
      </div>

      {editingTask && !pendingChange && (
        <ScheduledTaskEditDialog
          key={editingTask.id}
          task={editingTask}
          date={date}
          onClose={() => setEditingTask(null)}
          onRequestChange={requestChange}
        />
      )}

      {pendingChange && (
        <ScheduleConfirmDialog
          change={pendingChange}
          loading={pending}
          error={confirmError}
          onConfirm={confirmPendingChange}
          onCancel={cancelPendingChange}
        />
      )}
    </section>
  );
}
