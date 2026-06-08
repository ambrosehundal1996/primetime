import { createServerClient } from "@/lib/supabase/server";
import { getWeekBounds, getWeekBoundsForDate, todayStr } from "@/lib/dates";
import { getTasksForDay, getTasksForWeek } from "@/services/tasks";
import { getGoalsForWeek } from "@/services/goals";
import {
  calculateDailyMetrics,
  calculateWeeklyMetrics,
  calculateGoalCompletionPct,
  calculateGoalStatus,
  calculatePriorityAnalysis,
  findBestAndWorstDays,
  findRepeatedMisses,
} from "@/services/metrics";
import { computeGoalProgress } from "@/services/goals";
import type {
  DailySummary,
  SummaryTaskItem,
  WeeklySummary,
} from "@/types/database";

function toSummaryItem(task: {
  id: string;
  title: string;
  priority: string;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  status: string;
}): SummaryTaskItem {
  return {
    id: task.id,
    title: task.title,
    priority: task.priority as SummaryTaskItem["priority"],
    estimated_minutes: task.estimated_minutes,
    actual_minutes: task.actual_minutes,
    status: task.status as SummaryTaskItem["status"],
  };
}

export async function generateDailySummary(
  date: string = todayStr()
): Promise<DailySummary> {
  const supabase = createServerClient();
  const tasks = await getTasksForDay(date);
  const metrics = calculateDailyMetrics(tasks);

  const planned = tasks.map(toSummaryItem);
  const completed = tasks
    .filter((t) => ["completed", "partially_completed"].includes(t.status))
    .map(toSummaryItem);
  const missed = tasks
    .filter((t) => ["missed", "skipped"].includes(t.status))
    .map(toSummaryItem);

  const totalEstimated = tasks.reduce(
    (s, t) => s + (t.estimated_minutes ?? 0),
    0
  );
  const totalActual = tasks.reduce(
    (s, t) => s + (t.actual_minutes ?? 0),
    0
  );

  const summary: Omit<DailySummary, "id" | "created_at"> = {
    summary_date: date,
    planned,
    completed,
    missed,
    execution_rate: metrics.execution_rate,
    time_analysis: {
      total_estimated_minutes: totalEstimated,
      total_actual_minutes: totalActual,
      estimation_accuracy: metrics.planning_accuracy,
    },
    reflection: {
      went_well: [],
      went_poorly: [],
      changes_for_tomorrow: [],
    },
    metrics,
  };

  const { data, error } = await supabase
    .from("daily_summaries")
    .upsert(summary, { onConflict: "summary_date" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function generateWeeklySummary(
  weekStart?: string
): Promise<WeeklySummary> {
  const supabase = createServerClient();
  const bounds = weekStart
    ? getWeekBoundsForDate(weekStart)
    : getWeekBounds();
  const start = bounds.startStr;
  const end = bounds.endStr;

  const [tasks, goals] = await Promise.all([
    getTasksForWeek(start, end),
    getGoalsForWeek(start, end),
  ]);

  const metrics = calculateWeeklyMetrics(tasks, goals);
  const priorityAnalysis = calculatePriorityAnalysis(tasks);

  const tasksByDate: Record<string, typeof tasks> = {};
  for (const task of tasks) {
    if (!tasksByDate[task.task_date]) tasksByDate[task.task_date] = [];
    tasksByDate[task.task_date].push(task);
  }

  const { bestDay, worstDay } = findBestAndWorstDays(tasksByDate);
  const repeatedMisses = findRepeatedMisses(tasks);

  const weekEnded = new Date() > new Date(end + "T23:59:59");
  const goalCompletion = goals.map((g) => {
    const pct = calculateGoalCompletionPct(g.current_value, g.target_value);
    return {
      goal_id: g.id,
      title: g.title,
      priority: g.priority,
      target_value: g.target_value,
      current_value: g.current_value,
      completion_pct: pct,
      status: calculateGoalStatus(g.current_value, g.target_value, weekEnded),
    };
  });

  const completionPercentages: Record<string, number> = {};
  for (const gc of goalCompletion) {
    completionPercentages[gc.goal_id] = gc.completion_pct;
  }

  const summary: Omit<WeeklySummary, "id" | "created_at"> = {
    week_start_date: start,
    week_end_date: end,
    goal_completion: goalCompletion,
    completion_percentages: completionPercentages,
    priority_analysis: priorityAnalysis,
    best_day: bestDay,
    worst_day: worstDay,
    repeated_misses: repeatedMisses,
    time_management_insights: [],
    recommendations: [],
    metrics,
  };

  const { data, error } = await supabase
    .from("weekly_summaries")
    .upsert(summary, { onConflict: "week_start_date,week_end_date" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDailySummary(
  date: string
): Promise<DailySummary | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("summary_date", date)
    .single();

  if (error) return null;
  return data;
}

export async function updateDailyReflection(
  date: string,
  reflection: DailySummary["reflection"]
): Promise<void> {
  const supabase = createServerClient();
  await supabase
    .from("daily_summaries")
    .update({ reflection })
    .eq("summary_date", date);
}

export async function enrichSummaryWithAI(
  summary: DailySummary
): Promise<DailySummary> {
  const { Agent, run } = await import("@openai/agents");
  const { REFLECTION_PROMPT } = await import("@/agent/prompts");

  const agent = new Agent({
    name: "ReflectionAgent",
    instructions: REFLECTION_PROMPT,
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  });

  const input = JSON.stringify({
    planned: summary.planned,
    completed: summary.completed,
    missed: summary.missed,
    metrics: summary.metrics,
    time_analysis: summary.time_analysis,
  });

  const result = await run(agent, input);
  const output = result.finalOutput;

  if (typeof output === "string") {
    try {
      const reflection = JSON.parse(output);
      await updateDailyReflection(summary.summary_date, reflection);
      return { ...summary, reflection };
    } catch {
      // AI output wasn't valid JSON — keep empty reflection
    }
  }

  return summary;
}
