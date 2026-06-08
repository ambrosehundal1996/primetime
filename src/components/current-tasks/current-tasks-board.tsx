"use client";

import { useCallback, useState, useTransition } from "react";
import {
  assignPriorityAction,
  clearPriorityAction,
  createCurrentTaskAction,
  deleteCurrentTaskAction,
  updateCurrentTaskStatusAction,
} from "@/actions/current-tasks";
import { partitionCurrentTasks } from "@/lib/current-tasks";
import type { CurrentTask, EisenhowerQuadrant } from "@/types/database";
import { EISENHOWER_QUADRANTS } from "@/types/database";
import { AddTaskForm } from "./add-task-form";
import { VoiceInput } from "./voice-input";
import { EisenhowerMatrix } from "./eisenhower-matrix";
import { CurrentTaskCard } from "./current-task-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrentTasksBoardProps {
  initialTasks: CurrentTask[];
}

type InputMode = "manual" | "voice";

export function CurrentTasksBoard({ initialTasks }: CurrentTasksBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { unprioritized, byQuadrant } = partitionCurrentTasks(tasks);

  const refreshTask = useCallback((updated: CurrentTask) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === updated.id);
      if (idx === -1) return [updated, ...prev];
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  function handleCreate(title: string, description: string, source: "manual" | "voice" = "manual") {
    startTransition(async () => {
      const task = await createCurrentTaskAction({
        title,
        description: description || undefined,
        source,
      });
      setTasks((prev) => [task, ...prev]);
    });
  }

  function handleDrop(quadrant: EisenhowerQuadrant) {
    if (!draggingTaskId) return;
    const meta = EISENHOWER_QUADRANTS.find((q) => q.id === quadrant)!;

    startTransition(async () => {
      const updated = await assignPriorityAction(
        draggingTaskId,
        meta.is_urgent,
        meta.is_important
      );
      refreshTask(updated);
      setDraggingTaskId(null);
    });
  }

  function handleStatusChange(id: string, status: CurrentTask["status"]) {
    startTransition(async () => {
      const updated = await updateCurrentTaskStatusAction(id, status);
      if (status === "completed" || status === "cancelled") {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } else {
        refreshTask(updated);
      }
    });
  }

  function handleClearPriority(id: string) {
    startTransition(async () => {
      const updated = await clearPriorityAction(id);
      refreshTask(updated);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCurrentTaskAction(id);
      removeTask(id);
    });
  }

  return (
    <div className="space-y-8">
      {/* Input section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Capture</CardTitle>
            <div className="flex rounded-lg border border-gray-200 p-0.5">
              <ModeButton
                active={inputMode === "manual"}
                onClick={() => setInputMode("manual")}
                icon={<PenLine className="h-3.5 w-3.5" />}
                label="Manual"
              />
              <ModeButton
                active={inputMode === "voice"}
                onClick={() => setInputMode("voice")}
                icon={<Mic className="h-3.5 w-3.5" />}
                label="Voice"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inputMode === "manual" ? (
            <AddTaskForm
              onSubmit={async (title, description) => {
                handleCreate(title, description);
              }}
            />
          ) : (
            <VoiceInput
              disabled={isPending}
              onTranscript={(title, description) =>
                handleCreate(title, description ?? "", "voice")
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Unprioritized inbox */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Inbox — Not Yet Prioritized
          </h2>
          <p className="text-sm text-gray-500">
            Everything on your mind. Drag tasks onto the matrix below to assign
            urgency and importance.
          </p>
        </div>

        {unprioritized.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
            Inbox empty — add tasks above
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unprioritized.map((task) => (
              <div key={task.id} className="space-y-2">
                <CurrentTaskCard
                  task={task}
                  onDragStart={setDraggingTaskId}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
                <div className="flex flex-wrap gap-1 px-1">
                  {EISENHOWER_QUADRANTS.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        startTransition(async () => {
                          const updated = await assignPriorityAction(
                            task.id,
                            q.is_urgent,
                            q.is_important
                          );
                          refreshTask(updated);
                        });
                      }}
                      className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Eisenhower matrix */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Priority Matrix
          </h2>
          <p className="text-sm text-gray-500">
            Urgent vs important — drag tasks from the inbox or between quadrants.
          </p>
        </div>
        <EisenhowerMatrix
          byQuadrant={byQuadrant}
          draggingTaskId={draggingTaskId}
          onDragStart={setDraggingTaskId}
          onDrop={handleDrop}
          onStatusChange={handleStatusChange}
          onClearPriority={handleClearPriority}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-gray-900 text-white"
          : "text-gray-500 hover:text-gray-800"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
