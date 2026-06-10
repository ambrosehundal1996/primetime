"use client";

import { useEffect, useRef } from "react";
import { differenceInMinutes, parseISO } from "date-fns";
import {
  blockPositionStyle,
  getDayStart,
  getDurationMinutes,
  minutesFromDayStartToISO,
  yRatioToMinutes,
  MIN_EVENT_MINUTES,
} from "@/lib/calendar-layout";
import { formatMinutes } from "@/lib/utils";
import type { ActionTask } from "@/types/database";
import { cn } from "@/lib/utils";

type DragMode = "move" | "resize";

interface ActiveDrag {
  mode: DragMode;
  pointerId: number;
  originStart: string;
  originEnd: string;
  startMinutes: number;
  durationMinutes: number;
  moved: boolean;
}

interface ScheduledTaskBlockProps {
  task: ActionTask;
  date: string;
  gridRef: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  previewStart?: string;
  previewEnd?: string;
  isPendingConfirm?: boolean;
  onPreviewChange: (preview: { start: string; end: string } | null) => void;
  onCommit: (
    taskId: string,
    scheduledStart: string,
    scheduledEnd: string
  ) => void;
  onEdit: (task: ActionTask) => void;
}

export function ScheduledTaskBlock({
  task,
  date,
  gridRef,
  disabled,
  previewStart,
  previewEnd,
  isPendingConfirm,
  onPreviewChange,
  onCommit,
  onEdit,
}: ScheduledTaskBlockProps) {
  const dragRef = useRef<ActiveDrag | null>(null);
  const previewRef = useRef<{ start: string; end: string } | null>(null);
  const onCommitRef = useRef(onCommit);
  const onEditRef = useRef(onEdit);
  const onPreviewChangeRef = useRef(onPreviewChange);

  onCommitRef.current = onCommit;
  onEditRef.current = onEdit;
  onPreviewChangeRef.current = onPreviewChange;

  const displayStart = previewStart ?? task.scheduled_start!;
  const displayEnd = previewEnd ?? task.scheduled_end!;
  const style = blockPositionStyle(date, displayStart, displayEnd);
  const isDragging = previewStart !== undefined;

  function pointerYToMinutes(clientY: number): number | null {
    const grid = gridRef.current;
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    const yRatio = (clientY - rect.top) / rect.height;
    if (yRatio < 0 || yRatio > 1) return null;
    return yRatioToMinutes(yRatio);
  }

  function setPreview(next: { start: string; end: string } | null) {
    previewRef.current = next;
    onPreviewChangeRef.current(next);
  }

  function beginDrag(mode: DragMode, e: React.PointerEvent) {
    if (disabled || !task.scheduled_start || !task.scheduled_end) return;

    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const durationMinutes = getDurationMinutes(
      task.scheduled_start,
      task.scheduled_end
    );
    const startMinutes = differenceInMinutes(
      parseISO(task.scheduled_start),
      getDayStart(date)
    );

    dragRef.current = {
      mode,
      pointerId: e.pointerId,
      originStart: task.scheduled_start,
      originEnd: task.scheduled_end,
      startMinutes,
      durationMinutes,
      moved: false,
    };
  }

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;

      const minutes = pointerYToMinutes(e.clientY);
      if (minutes === null) return;

      let nextStartMinutes = drag.startMinutes;
      let nextEndMinutes = drag.startMinutes + drag.durationMinutes;

      if (drag.mode === "move") {
        nextStartMinutes = minutes;
        nextEndMinutes = minutes + drag.durationMinutes;
      } else {
        nextEndMinutes = Math.max(
          drag.startMinutes + MIN_EVENT_MINUTES,
          minutes
        );
      }

      if (
        nextStartMinutes !== drag.startMinutes ||
        nextEndMinutes !== drag.startMinutes + drag.durationMinutes
      ) {
        drag.moved = true;
      }

      setPreview({
        start: minutesFromDayStartToISO(date, nextStartMinutes),
        end: minutesFromDayStartToISO(date, nextEndMinutes),
      });
    }

    function onPointerUp(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;

      const committed = previewRef.current;
      dragRef.current = null;

      if (!drag.moved) {
        setPreview(null);
        if (drag.mode === "move") onEditRef.current(task);
        return;
      }

      if (!committed) {
        setPreview(null);
        return;
      }

      if (
        committed.start === drag.originStart &&
        committed.end === drag.originEnd
      ) {
        setPreview(null);
        return;
      }

      onCommitRef.current(task.id, committed.start, committed.end);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [date, task]);

  return (
    <div
      onPointerDown={(e) => beginDrag("move", e)}
      className={cn(
        "absolute left-14 right-2 rounded-md border px-2 py-1 overflow-hidden z-20 touch-none select-none",
        isPendingConfirm
          ? "border-2 border-dashed border-gray-600 bg-gray-900/80"
          : "border-gray-800 bg-gray-900",
        disabled
          ? "opacity-60 pointer-events-none"
          : "cursor-grab active:cursor-grabbing",
        isDragging && !isPendingConfirm && "opacity-80 ring-2 ring-white/40 shadow-lg"
      )}
      style={style}
    >
      <p className="text-[11px] font-medium text-white truncate pointer-events-none">
        {task.title}
      </p>
      <p className="text-[10px] text-gray-300 pointer-events-none">
        {isPendingConfirm
          ? "Pending confirm"
          : `${task.priority}${task.estimated_minutes ? ` · ${formatMinutes(task.estimated_minutes)}` : ""}`}
      </p>
      <div
        data-resize
        onPointerDown={(e) => beginDrag("resize", e)}
        className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize hover:bg-white/20"
      />
    </div>
  );
}
