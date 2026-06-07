import type {
  ActionTask,
  DailyMetrics,
  GoalPriority,
  PriorityAnalysis,
  WeeklyGoal,
  WeeklyMetrics,
} from "@/types/database";
import { daysElapsedInWeek, daysRemainingInWeek } from "@/lib/dates";

const COMPLETED_STATUSES = new Set(["completed", "partially_completed"]);
const MISSED_STATUSES = new Set(["missed", "skipped"]);

export function calculateExecutionRate(
  completed: number,
  planned: number
): number {
  if (planned === 0) return 0;
  return completed / planned;
}

export function calculatePlanningAccuracy(
  estimatedMinutes: number,
  actualMinutes: number
): number | null {
  if (estimatedMinutes === 0 || actualMinutes === 0) return null;
  const ratio = actualMinutes / estimatedMinutes;
  return Math.max(0, 1 - Math.abs(1 - ratio));
}

export function calculateGoalCompletionPct(
  current: number,
  target: number
): number {
  if (target === 0) return 0;
  return Math.min(1, current / target);
}

export function calculateGoalStatus(
  current: number,
  target: number,
  weekEnded: boolean
): "active" | "met" | "partially_met" | "missed" {
  if (!weekEnded) {
    if (current >= target) return "met";
    return "active";
  }
  if (current >= target) return "met";
  if (current > 0) return "partially_met";
  return "missed";
}

export function calculatePaceStatus(
  current: number,
  target: number,
  weekStartDate: string
): "ahead" | "on_track" | "behind" {
  const daysElapsed = daysElapsedInWeek(new Date(weekStartDate + "T12:00:00"));
  const daysRemaining = daysRemainingInWeek();
  const totalDays = daysElapsed + daysRemaining;
  const expectedValue = (target / totalDays) * daysElapsed;

  if (current >= expectedValue * 1.1) return "ahead";
  if (current >= expectedValue * 0.85) return "on_track";
  return "behind";
}

export function calculateExpectedValue(
  target: number,
  weekStartDate: string
): number {
  const daysElapsed = daysElapsedInWeek(new Date(weekStartDate + "T12:00:00"));
  const daysRemaining = daysRemainingInWeek();
  const totalDays = daysElapsed + daysRemaining;
  return (target / totalDays) * daysElapsed;
}

export function calculateDailyTarget(
  current: number,
  target: number
): number {
  const daysRemaining = daysRemainingInWeek();
  if (daysRemaining === 0) return Math.max(0, target - current);
  return (target - current) / daysRemaining;
}

export function calculateDailyMetrics(tasks: ActionTask[]): DailyMetrics {
  const planned = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const missed = tasks.filter((t) => MISSED_STATUSES.has(t.status)).length;
  const partial = tasks.filter((t) => t.status === "partially_completed").length;
  const reschedules = tasks.filter((t) => t.status === "rescheduled").length;

  const totalEstimated = tasks.reduce(
    (sum, t) => sum + (t.estimated_minutes ?? 0),
    0
  );
  const totalActual = tasks.reduce(
    (sum, t) => sum + (t.actual_minutes ?? 0),
    0
  );

  return {
    planned_tasks: planned,
    completed_tasks: completed,
    missed_tasks: missed,
    partial_completions: partial,
    reschedules,
    execution_rate: calculateExecutionRate(completed, planned),
    planning_accuracy: calculatePlanningAccuracy(totalEstimated, totalActual),
  };
}

export function calculatePriorityAnalysis(
  tasks: ActionTask[]
): PriorityAnalysis {
  const priorities: GoalPriority[] = ["P0", "P1", "P2"];
  const result = {} as PriorityAnalysis;

  for (const p of priorities) {
    const priorityTasks = tasks.filter((t) => t.priority === p);
    const planned = priorityTasks.length;
    const completed = priorityTasks.filter((t) =>
      COMPLETED_STATUSES.has(t.status)
    ).length;
    result[p] = {
      planned,
      completed,
      rate: calculateExecutionRate(completed, planned),
    };
  }

  return result;
}

export function calculateWeeklyMetrics(
  tasks: ActionTask[],
  goals: WeeklyGoal[]
): WeeklyMetrics {
  const dailyMetrics = calculateDailyMetrics(tasks);
  const priorityAnalysis = calculatePriorityAnalysis(tasks);

  const goalScores = goals.map((g) =>
    calculateGoalCompletionPct(g.current_value, g.target_value)
  );
  const weeklyCommitmentScore =
    goalScores.length > 0
      ? goalScores.reduce((a, b) => a + b, 0) / goalScores.length
      : 0;

  const executionScore =
    dailyMetrics.execution_rate * 0.6 + weeklyCommitmentScore * 0.4;

  return {
    planned_tasks: dailyMetrics.planned_tasks,
    completed_tasks: dailyMetrics.completed_tasks,
    missed_tasks: dailyMetrics.missed_tasks,
    execution_score: executionScore,
    weekly_commitment_score: weeklyCommitmentScore,
    p0_completion_pct: priorityAnalysis.P0.rate,
    p1_completion_pct: priorityAnalysis.P1.rate,
    p2_completion_pct: priorityAnalysis.P2.rate,
  };
}

export function findBestAndWorstDays(
  tasksByDate: Record<string, ActionTask[]>
): { bestDay: string | null; worstDay: string | null } {
  let bestDay: string | null = null;
  let worstDay: string | null = null;
  let bestRate = -1;
  let worstRate = 2;

  for (const [date, dayTasks] of Object.entries(tasksByDate)) {
    const metrics = calculateDailyMetrics(dayTasks);
    if (dayTasks.length === 0) continue;
    if (metrics.execution_rate > bestRate) {
      bestRate = metrics.execution_rate;
      bestDay = date;
    }
    if (metrics.execution_rate < worstRate) {
      worstRate = metrics.execution_rate;
      worstDay = date;
    }
  }

  return { bestDay, worstDay };
}

export function findRepeatedMisses(
  tasks: ActionTask[]
): { title: string; count: number; priority: GoalPriority }[] {
  const missCounts = new Map<string, { count: number; priority: GoalPriority }>();

  for (const task of tasks) {
    if (!MISSED_STATUSES.has(task.status)) continue;
    const existing = missCounts.get(task.title);
    if (existing) {
      existing.count++;
    } else {
      missCounts.set(task.title, { count: 1, priority: task.priority });
    }
  }

  return Array.from(missCounts.entries())
    .map(([title, data]) => ({ title, ...data }))
    .filter((m) => m.count >= 2)
    .sort((a, b) => b.count - a.count);
}
