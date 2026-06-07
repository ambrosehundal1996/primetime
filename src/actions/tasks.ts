"use server";

import { revalidatePath } from "next/cache";
import {
  createTask,
  getTasksForDay,
  updateTaskStatus,
  logTaskProgress,
  scheduleTask,
} from "@/services/tasks";
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
