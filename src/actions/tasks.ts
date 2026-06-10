"use server";

import { revalidatePath } from "next/cache";
import {
  createTask,
  getTasksForDay,
  updateTaskStatus,
  logTaskProgress,
  scheduleTask,
  scheduleTaskWithCalendar,
  updateScheduledTaskWithCalendar,
  unscheduleTaskWithCalendar,
} from "@/services/tasks";
import { hasScheduleConflict } from "@/services/calendar";
import { clampScheduleRange } from "@/lib/calendar-layout";
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

async function validateAndScheduleTask(
  taskId: string,
  date: string,
  scheduledStart: string,
  scheduledEnd: string,
  mode: "create" | "update",
  title?: string
): Promise<{ success: boolean; error?: string }> {
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
  const { start, end } = clampScheduleRange(date, scheduledStart, scheduledEnd);

  if (hasScheduleConflict(externalEvents, dayTasks, start, end, taskId)) {
    return {
      success: false,
      error: "That time overlaps another event or scheduled task.",
    };
  }

  if (mode === "update") {
    await updateScheduledTaskWithCalendar(taskId, {
      title,
      scheduledStart: start,
      scheduledEnd: end,
    });
  } else {
    await scheduleTaskWithCalendar(taskId, start, end);
  }

  revalidatePath("/today");
  revalidatePath("/calendar");
  return { success: true };
}

export async function scheduleTaskToCalendarAction(
  taskId: string,
  date: string,
  scheduledStart: string,
  scheduledEnd: string
): Promise<{ success: boolean; error?: string }> {
  try {
    return await validateAndScheduleTask(
      taskId,
      date,
      scheduledStart,
      scheduledEnd,
      "create"
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to schedule task.";
    return { success: false, error: message };
  }
}

export async function updateScheduledTaskAction(
  taskId: string,
  date: string,
  scheduledStart: string,
  scheduledEnd: string,
  title?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    return await validateAndScheduleTask(
      taskId,
      date,
      scheduledStart,
      scheduledEnd,
      "update",
      title
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update schedule.";
    return { success: false, error: message };
  }
}

export async function unscheduleTaskAction(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await unscheduleTaskWithCalendar(taskId);
    revalidatePath("/today");
    revalidatePath("/calendar");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove from calendar.";
    return { success: false, error: message };
  }
}
