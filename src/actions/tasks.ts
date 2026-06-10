"use server";

import { revalidatePath } from "next/cache";
import {
  createTask,
  getTasksForDay,
  updateTaskStatus,
  logTaskProgress,
  scheduleTask,
  scheduleTaskWithCalendar,
} from "@/services/tasks";
import { hasSchedulingConflict } from "@/services/calendar";
import type { CreateActionTaskInput, UpdateTaskStatusInput } from "@/types/database";
import { todayStr } from "@/lib/dates";

export async function fetchTodayTasksAction(date?: string) {
  return getTasksForDay(date ?? todayStr());
}

export async function createTaskAction(input: CreateActionTaskInput) {
  const task = await createTask(input);
  revalidatePath("/today");
  return task;
}

export async function updateTaskStatusAction(input: UpdateTaskStatusInput) {
  const task = await updateTaskStatus(input);
  revalidatePath("/today");
  revalidatePath("/goals");
  return task;
}

export async function logTaskProgressAction(
  taskId: string,
  completedValue: number,
  actualMinutes?: number
) {
  const task = await logTaskProgress(taskId, completedValue, actualMinutes);
  revalidatePath("/today");
  revalidatePath("/goals");
  return task;
}

export async function scheduleTaskAction(
  taskId: string,
  scheduledStart: string,
  scheduledEnd: string
) {
  const task = await scheduleTask(taskId, scheduledStart, scheduledEnd);
  revalidatePath("/today");
  revalidatePath("/calendar");
  return task;
}

export async function scheduleTaskToCalendarAction(
  taskId: string,
  date: string,
  scheduledStart: string,
  scheduledEnd: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { getCalendarEvents } = await import("@/services/calendar");
    const [{ events }, dayTasks] = await Promise.all([
      getCalendarEvents(date),
      getTasksForDay(date),
    ]);
    const task = dayTasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, error: "Task not found for this day." };
    }

    const linkedEventIds = new Set(
      dayTasks.map((t) => t.google_event_id).filter(Boolean)
    );

    const externalEvents = events.filter((e) => !linkedEventIds.has(e.id));
    if (hasSchedulingConflict(externalEvents, scheduledStart, scheduledEnd)) {
      return {
        success: false,
        error: "That time overlaps an existing calendar event.",
      };
    }

    await scheduleTaskWithCalendar(taskId, scheduledStart, scheduledEnd);
    revalidatePath("/today");
    revalidatePath("/calendar");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to schedule task.";
    return { success: false, error: message };
  }
}
