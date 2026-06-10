"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMinutes } from "@/lib/utils";
import { formatTime } from "@/lib/dates";
import type { ActionTask } from "@/types/database";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { TaskCompletionDialog } from "./task-completion-dialog";
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: ActionTask[];
  title: string;
  emptyMessage?: string;
}

function TaskIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "partially_completed":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "missed":
    case "skipped":
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <Circle className="h-4 w-4 text-gray-300" />;
  }
}

function progressLabel(task: ActionTask): string | null {
  if (task.target_value == null || task.target_value <= 0) return null;
  const done = task.completed_value ?? 0;
  return `${done}/${task.target_value}`;
}

export function TaskList({ tasks, title, emptyMessage }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<ActionTask | null>(null);

  if (tasks.length === 0) {
    if (!title) return null;
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
        <p className="text-sm text-gray-400">
          {emptyMessage ?? "No tasks"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div>
        {title && (
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            {title} ({tasks.length})
          </h3>
        )}
        <div className="space-y-2">
          {tasks.map((task) => {
            const progress = progressLabel(task);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => setSelectedTask(task)}
                className="w-full text-left"
              >
                <Card
                  className={cn(
                    "border-gray-100 transition-shadow hover:shadow-md hover:border-gray-300 cursor-pointer",
                    selectedTask?.id === task.id && "ring-2 ring-gray-900"
                  )}
                >
                  <CardContent className="flex items-center gap-3 py-3">
                    <TaskIcon status={task.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="priority" value={task.priority}>
                          {task.priority}
                        </Badge>
                        {progress && (
                          <span className="text-xs font-medium text-gray-600">
                            {progress}
                          </span>
                        )}
                        {task.estimated_minutes && (
                          <span className="text-xs text-gray-400">
                            {formatMinutes(task.estimated_minutes)}
                          </span>
                        )}
                        {task.scheduled_start && (
                          <span className="text-xs text-gray-400">
                            {formatTime(task.scheduled_start)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="status" value={task.status}>
                      {task.status.replace("_", " ")}
                    </Badge>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      {selectedTask && (
        <TaskCompletionDialog
          key={selectedTask.id}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
