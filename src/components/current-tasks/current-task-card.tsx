"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CurrentTask } from "@/types/database";
import { GripVertical, MoreHorizontal } from "lucide-react";
import { useState } from "react";

interface CurrentTaskCardProps {
  task: CurrentTask;
  draggable?: boolean;
  onDragStart?: (taskId: string) => void;
  onStatusChange?: (id: string, status: CurrentTask["status"]) => void;
  onClearPriority?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function CurrentTaskCard({
  task,
  draggable = true,
  onDragStart,
  onStatusChange,
  onClearPriority,
  onDelete,
  compact = false,
}: CurrentTaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      draggable={draggable}
      onDragStart={() => onDragStart?.(task.id)}
      className={cn(
        "group rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
        )}
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium text-gray-900", compact ? "text-sm" : "text-sm")}>
            {task.title}
          </p>
          {task.description && !compact && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="status" value={task.status}>
              {task.status.replace("_", " ")}
            </Badge>
            {task.source === "voice" && (
              <span className="text-xs text-gray-400">via voice</span>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {task.status !== "in_progress" && (
                  <MenuButton
                    onClick={() => {
                      onStatusChange?.(task.id, "in_progress");
                      setMenuOpen(false);
                    }}
                  >
                    Mark in progress
                  </MenuButton>
                )}
                {task.status !== "completed" && (
                  <MenuButton
                    onClick={() => {
                      onStatusChange?.(task.id, "completed");
                      setMenuOpen(false);
                    }}
                  >
                    Mark complete
                  </MenuButton>
                )}
                {task.status !== "deferred" && (
                  <MenuButton
                    onClick={() => {
                      onStatusChange?.(task.id, "deferred");
                      setMenuOpen(false);
                    }}
                  >
                    Defer
                  </MenuButton>
                )}
                {(task.is_urgent !== null || task.is_important !== null) && (
                  <MenuButton
                    onClick={() => {
                      onClearPriority?.(task.id);
                      setMenuOpen(false);
                    }}
                  >
                    Remove from matrix
                  </MenuButton>
                )}
                <MenuButton
                  destructive
                  onClick={() => {
                    onDelete?.(task.id);
                    setMenuOpen(false);
                  }}
                >
                  Delete
                </MenuButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50",
        destructive ? "text-red-600" : "text-gray-700"
      )}
    >
      {children}
    </button>
  );
}
