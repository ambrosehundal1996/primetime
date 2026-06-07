"use server";

import { revalidatePath } from "next/cache";
import { createGoal, getActiveGoals, getGoalProgressList } from "@/services/goals";
import type { CreateWeeklyGoalInput } from "@/types/database";

export async function createWeeklyGoalAction(input: CreateWeeklyGoalInput) {
  const goal = await createGoal(input);
  revalidatePath("/goals");
  revalidatePath("/today");
  return goal;
}

export async function fetchActiveGoalsAction() {
  return getActiveGoals();
}

export async function fetchGoalProgressAction() {
  return getGoalProgressList();
}
