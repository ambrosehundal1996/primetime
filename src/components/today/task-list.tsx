"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMinutes } from "@/lib/utils";
import { formatTime } from "@/lib/dates";
import type { ActionTask } from "@/types/database";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";

interface TaskListProps {
  tasks: ActionTask[];
  title: string;
  emptyMessage?: string;
}

function TaskIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "missed":
    case "skipped":
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <Circle className="h-4 w-4 text-gray-300" />;
  }
}

export function TaskList({ tasks, title, emptyMessage }: TaskListProps) {
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
    <div>
      {title && (
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          {title} ({tasks.length})
        </h3>
      )}
      <div className="space-y-2">
        {tasks.map((task) => (
          <Card key={task.id} className="border-gray-100">
            <CardContent className="flex items-center gap-3 py-3">
              <TaskIcon status={task.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="priority" value={task.priority}>
                    {task.priority}
                  </Badge>
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
        ))}
      </div>
    </div>
  );
}
