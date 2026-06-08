"use server";

import { revalidatePath } from "next/cache";
import {
  assignPriority,
  clearPriority,
  createCurrentTask,
  deleteCurrentTask,
  getCurrentTasks,
  updateCurrentTask,
} from "@/services/current-tasks";
import type {
  CreateCurrentTaskInput,
  CurrentTaskStatus,
  UpdateCurrentTaskInput,
} from "@/types/database";

function revalidate() {
  revalidatePath("/current-tasks");
}

export async function fetchCurrentTasksAction(includeCompleted = false) {
  return getCurrentTasks(includeCompleted);
}

export async function createCurrentTaskAction(input: CreateCurrentTaskInput) {
  const task = await createCurrentTask(input);
  revalidate();
  return task;
}

export async function updateCurrentTaskAction(input: UpdateCurrentTaskInput) {
  const task = await updateCurrentTask(input);
  revalidate();
  return task;
}

export async function assignPriorityAction(
  id: string,
  isUrgent: boolean,
  isImportant: boolean
) {
  const task = await assignPriority(id, isUrgent, isImportant);
  revalidate();
  return task;
}

export async function clearPriorityAction(id: string) {
  const task = await clearPriority(id);
  revalidate();
  return task;
}

export async function updateCurrentTaskStatusAction(
  id: string,
  status: CurrentTaskStatus
) {
  const task = await updateCurrentTask({ id, status });
  revalidate();
  return task;
}

export async function deleteCurrentTaskAction(id: string) {
  await deleteCurrentTask(id);
  revalidate();
}
