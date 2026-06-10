"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  logTaskProgressAction,
  updateTaskStatusAction,
} from "@/actions/tasks";
import type { ActionTask } from "@/types/database";
import { X } from "lucide-react";

interface TaskCompletionDialogProps {
  task: ActionTask;
  onClose: () => void;
}

export function TaskCompletionDialog({
  task,
  onClose,
}: TaskCompletionDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNumeric = task.target_value != null && task.target_value > 0;
  const target = task.target_value ?? 1;
  const [completedValue, setCompletedValue] = useState<string>(
    String(task.completed_value ?? 0)
  );
  const [actualMinutes, setActualMinutes] = useState<string>(
    task.actual_minutes != null ? String(task.actual_minutes) : ""
  );

  async function handleSaveProgress() {
    const value = parseFloat(completedValue);
    if (isNaN(value) || value < 0) {
      setError("Enter a valid number");
      return;
    }
    if (value > target) {
      setError(`Cannot exceed target of ${target}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await logTaskProgressAction(
        task.id,
        value,
        actualMinutes ? parseInt(actualMinutes, 10) : undefined
      );
      router.refresh();
      onClose();
    } catch {
      setError("Failed to save progress");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(
    status: "completed" | "missed" | "skipped",
    value?: number
  ) {
    setLoading(true);
    setError(null);
    try {
      if (isNumeric && status === "completed" && value === undefined) {
        await logTaskProgressAction(
          task.id,
          target,
          actualMinutes ? parseInt(actualMinutes, 10) : undefined
        );
      } else {
        await updateTaskStatusAction({
          task_id: task.id,
          status,
          completed_value:
            status === "completed"
              ? (value ?? (isNumeric ? target : 1))
              : undefined,
          actual_minutes: actualMinutes
            ? parseInt(actualMinutes, 10)
            : undefined,
          notes:
            status === "missed"
              ? "Marked missed from Today view"
              : status === "skipped"
                ? "Marked skipped from Today view"
                : undefined,
        });
      }
      router.refresh();
      onClose();
    } catch {
      setError("Failed to update task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 pr-8">
          {task.title}
        </h2>
        {task.description && (
          <p className="mt-1 text-sm text-gray-500">{task.description}</p>
        )}

        <p className="mt-2 text-xs text-gray-400 capitalize">
          Current: {task.status.replace("_", " ")}
          {isNumeric && (
            <span>
              {" "}
              · {task.completed_value ?? 0}/{target} done
            </span>
          )}
        </p>

        <div className="mt-5 space-y-4">
          {isNumeric ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How many did you complete?
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={target}
                  step={1}
                  value={completedValue}
                  onChange={(e) => setCompletedValue(e.target.value)}
                  className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-500">of {target}</span>
              </div>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time spent (optional)
            </label>
            <input
              type="number"
              min={0}
              placeholder="Minutes"
              value={actualMinutes}
              onChange={(e) => setActualMinutes(e.target.value)}
              className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {isNumeric ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleSaveProgress}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Save progress
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleStatus("completed")}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Complete
              </button>
            )}
            {isNumeric && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleStatus("completed")}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Mark all done
              </button>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleStatus("missed")}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Missed
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleStatus("skipped")}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
