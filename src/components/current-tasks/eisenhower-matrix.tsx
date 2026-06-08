"use client";

import { cn } from "@/lib/utils";
import {
  EISENHOWER_QUADRANTS,
  type CurrentTask,
  type EisenhowerQuadrant,
} from "@/types/database";
import { CurrentTaskCard } from "./current-task-card";

interface EisenhowerMatrixProps {
  byQuadrant: Record<EisenhowerQuadrant, CurrentTask[]>;
  draggingTaskId: string | null;
  onDragStart: (taskId: string) => void;
  onDrop: (quadrant: EisenhowerQuadrant) => void;
  onStatusChange: (id: string, status: CurrentTask["status"]) => void;
  onClearPriority: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EisenhowerMatrix({
  byQuadrant,
  draggingTaskId,
  onDragStart,
  onDrop,
  onStatusChange,
  onClearPriority,
  onDelete,
}: EisenhowerMatrixProps) {
  const gridOrder: EisenhowerQuadrant[] = [
    "do_first",
    "schedule",
    "delegate",
    "eliminate",
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span className="font-medium">← Urgent</span>
        <span className="font-medium">Not Urgent →</span>
      </div>

      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200 -translate-y-1/2 pointer-events-none" />

        <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-gray-400 whitespace-nowrap hidden lg:block">
          Important ↑
        </div>
        <div className="absolute -left-8 bottom-4 -rotate-90 text-xs font-medium text-gray-400 whitespace-nowrap hidden lg:block">
          Not Important ↓
        </div>

        <div className="grid grid-cols-2 gap-3">
          {gridOrder.map((quadrantId) => {
            const meta = EISENHOWER_QUADRANTS.find((q) => q.id === quadrantId)!;
            const tasks = byQuadrant[quadrantId];

            return (
              <QuadrantDropZone
                key={quadrantId}
                meta={meta}
                tasks={tasks}
                isDragTarget={!!draggingTaskId}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(quadrantId)}
                onDragStart={onDragStart}
                onStatusChange={onStatusChange}
                onClearPriority={onClearPriority}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-400 px-1 lg:hidden">
        <span>↑ Important</span>
        <span>Not Important ↓</span>
      </div>
    </div>
  );
}

function QuadrantDropZone({
  meta,
  tasks,
  isDragTarget,
  onDragOver,
  onDrop,
  onDragStart,
  onStatusChange,
  onClearPriority,
  onDelete,
}: {
  meta: (typeof EISENHOWER_QUADRANTS)[number];
  tasks: CurrentTask[];
  isDragTarget: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragStart: (id: string) => void;
  onStatusChange: (id: string, status: CurrentTask["status"]) => void;
  onClearPriority: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={cn(
        "min-h-[200px] rounded-xl border-2 border-dashed p-3 transition-colors",
        meta.color,
        isDragTarget && "ring-2 ring-gray-900/20"
      )}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{meta.label}</h3>
        <p className="text-xs text-gray-500">{meta.subtitle}</p>
        <p className="text-xs text-gray-400 mt-0.5">{tasks.length} tasks</p>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <CurrentTaskCard
            key={task.id}
            task={task}
            compact
            onDragStart={onDragStart}
            onStatusChange={onStatusChange}
            onClearPriority={onClearPriority}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">
            Drop tasks here
          </p>
        )}
      </div>
    </div>
  );
}
