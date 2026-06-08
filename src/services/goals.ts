import { createServerClient } from "@/lib/supabase/server";
import { getWeekBounds, todayStr } from "@/lib/dates";
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

const VISIBLE_GOAL_STATUSES = [
  "active",
  "met",
  "partially_met",
  "missed",
] as const;

export async function getGoalsForWeek(
  weekStart: string,
  weekEnd: string
): Promise<WeeklyGoal[]> {
  const supabase = createServerClient();

  // Goals whose week range overlaps the selected week
  const { data, error } = await supabase
    .from("weekly_goals")
    .select("*")
    .lte("week_start_date", weekEnd)
    .gte("week_end_date", weekStart)
    .in("status", [...VISIBLE_GOAL_STATUSES])
    .order("priority", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getActiveGoals(): Promise<WeeklyGoal[]> {
  const today = todayStr();
  const bounds = getWeekBounds();
  return getGoalsForWeek(bounds.startStr, bounds.endStr).then((goals) =>
    goals.filter(
      (g) => g.week_start_date <= today && g.week_end_date >= today
    )
  );
}

export async function getAllGoals(): Promise<WeeklyGoal[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("weekly_goals")
    .select("*")
    .order("created_at", { ascending: false });

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
  weekStart?: string,
  weekEnd?: string
): Promise<GoalProgress[]> {
  const bounds = getWeekBounds();
  const start = weekStart ?? bounds.startStr;
  const end = weekEnd ?? bounds.endStr;
  const goals = await getGoalsForWeek(start, end);
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
