import { createServerClient } from "@/lib/supabase/server";
import { getWeekBounds } from "@/lib/dates";
import {
  calculateGoalCompletionPct,
  calculateGoalStatus,
  calculatePaceStatus,
  calculateExpectedValue,
  calculateDailyTarget,
} from "@/services/metrics";
import type {
  CreateWeeklyGoalInput,
  GoalProgress,
  WeeklyGoal,
} from "@/types/database";

export async function getActiveGoals(
  weekStart?: string
): Promise<WeeklyGoal[]> {
  const supabase = createServerClient();
  const bounds = getWeekBounds();
  const start = weekStart ?? bounds.startStr;

  const { data, error } = await supabase
    .from("weekly_goals")
    .select("*")
    .eq("week_start_date", start)
    .in("status", ["active", "met", "partially_met"])
    .order("priority", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getGoalById(id: string): Promise<WeeklyGoal | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("weekly_goals")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createGoal(
  input: CreateWeeklyGoalInput
): Promise<WeeklyGoal> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("weekly_goals")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoalProgress(
  goalId: string,
  increment: number
): Promise<WeeklyGoal> {
  const supabase = createServerClient();
  const goal = await getGoalById(goalId);
  if (!goal) throw new Error("Goal not found");

  const newValue = goal.current_value + increment;
  const weekEnded = new Date() > new Date(goal.week_end_date + "T23:59:59");
  const status = calculateGoalStatus(newValue, goal.target_value, weekEnded);

  const { data, error } = await supabase
    .from("weekly_goals")
    .update({ current_value: newValue, status })
    .eq("id", goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function computeGoalProgress(goal: WeeklyGoal): GoalProgress {
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(goal.week_end_date).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
  );

  return {
    goal,
    completion_pct: calculateGoalCompletionPct(
      goal.current_value,
      goal.target_value
    ),
    pace_status: calculatePaceStatus(
      goal.current_value,
      goal.target_value,
      goal.week_start_date
    ),
    days_remaining: daysRemaining,
    expected_value: calculateExpectedValue(
      goal.target_value,
      goal.week_start_date
    ),
    daily_target: calculateDailyTarget(goal.current_value, goal.target_value),
  };
}

export async function getGoalProgressList(
  weekStart?: string
): Promise<GoalProgress[]> {
  const goals = await getActiveGoals(weekStart);
  return goals.map(computeGoalProgress);
}

export async function getGoalsBehindPace(): Promise<GoalProgress[]> {
  const progress = await getGoalProgressList();
  return progress
    .filter((p) => p.pace_status === "behind")
    .sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2 };
      return priorityOrder[a.goal.priority] - priorityOrder[b.goal.priority];
    });
}
