import { createServerClient } from "@/lib/supabase/server";
import { getWeekBounds } from "@/lib/dates";
import { getTasksForWeek } from "@/services/tasks";
import {
  calculateDailyMetrics,
  calculatePlanningAccuracy,
} from "@/services/metrics";
import type { BehaviorInsight, InsightCategory } from "@/types/database";

export async function getBehaviorInsights(
  activeOnly = true
): Promise<BehaviorInsight[]> {
  const supabase = createServerClient();
  let query = supabase
    .from("behavior_insights")
    .select("*")
    .order("confidence", { ascending: false });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createInsight(
  insight: Pick<BehaviorInsight, "category" | "title" | "description"> & {
    evidence?: Record<string, unknown>;
    confidence?: number;
  }
): Promise<BehaviorInsight> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("behavior_insights")
    .insert(insight)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function generateInsightsFromHistory(): Promise<BehaviorInsight[]> {
  const bounds = getWeekBounds();
  const tasks = await getTasksForWeek(bounds.startStr, bounds.endStr);
  const insights: BehaviorInsight[] = [];

  const hourBuckets = analyzeProductivityByHour(tasks);
  const topHour = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0];
  if (topHour && topHour[1] >= 3) {
    const insight = await createInsight({
      category: "productivity_window",
      title: `Most productive around ${topHour[0]}`,
      description: `You complete the most tasks between ${topHour[0]}. Consider scheduling deep work during this window.`,
      evidence: { hour: topHour[0], completions: topHour[1] },
      confidence: Math.min(0.9, topHour[1] / 10),
    });
    insights.push(insight);
  }

  const estimationInsights = analyzeEstimationAccuracy(tasks);
  for (const est of estimationInsights) {
    const insight = await createInsight({
      category: "estimation_accuracy",
      title: est.title,
      description: est.description,
      evidence: est.evidence,
      confidence: est.confidence,
    });
    insights.push(insight);
  }

  const missPatterns = analyzeMissPatterns(tasks);
  for (const miss of missPatterns) {
    const insight = await createInsight({
      category: "miss_pattern",
      title: miss.title,
      description: miss.description,
      evidence: miss.evidence,
      confidence: miss.confidence,
    });
    insights.push(insight);
  }

  return insights;
}

function analyzeProductivityByHour(
  tasks: { completed_at: string | null; status: string }[]
): Record<string, number> {
  const buckets: Record<string, number> = {};

  for (const task of tasks) {
    if (task.status !== "completed" || !task.completed_at) continue;
    const hour = new Date(task.completed_at).getHours();
    const label = `${hour}:00–${hour + 1}:00`;
    buckets[label] = (buckets[label] ?? 0) + 1;
  }

  return buckets;
}

function analyzeEstimationAccuracy(
  tasks: {
    title: string;
    estimated_minutes: number | null;
    actual_minutes: number | null;
  }[]
): {
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  confidence: number;
}[] {
  const byTitle = new Map<
    string,
    { estimated: number; actual: number; count: number }
  >();

  for (const task of tasks) {
    if (!task.estimated_minutes || !task.actual_minutes) continue;
    const existing = byTitle.get(task.title) ?? {
      estimated: 0,
      actual: 0,
      count: 0,
    };
    existing.estimated += task.estimated_minutes;
    existing.actual += task.actual_minutes;
    existing.count++;
    byTitle.set(task.title, existing);
  }

  const results = [];
  for (const [title, data] of byTitle) {
    if (data.count < 2) continue;
    const accuracy = calculatePlanningAccuracy(data.estimated, data.actual);
    if (accuracy !== null && accuracy < 0.6) {
      const ratio = data.actual / data.estimated;
      const direction = ratio > 1 ? "underestimates" : "overestimates";
      results.push({
        title: `Consistently ${direction} "${title}" duration`,
        description: `On average, "${title}" takes ${Math.round(ratio * 100)}% of estimated time across ${data.count} instances.`,
        evidence: { title, ratio, count: data.count },
        confidence: Math.min(0.85, data.count / 5),
      });
    }
  }

  return results;
}

function analyzeMissPatterns(
  tasks: {
    title: string;
    status: string;
    scheduled_start: string | null;
    priority: string;
  }[]
): {
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  confidence: number;
}[] {
  const missedUnscheduled = tasks.filter(
    (t) =>
      ["missed", "skipped"].includes(t.status) && !t.scheduled_start
  );

  if (missedUnscheduled.length >= 3) {
    const byTitle = new Map<string, number>();
    for (const t of missedUnscheduled) {
      byTitle.set(t.title, (byTitle.get(t.title) ?? 0) + 1);
    }

    const results = [];
    for (const [title, count] of byTitle) {
      if (count >= 2) {
        results.push({
          title: `Avoids "${title}" when unscheduled`,
          description: `"${title}" is frequently missed when not assigned a specific time block. Try scheduling it explicitly.`,
          evidence: { title, miss_count: count, unscheduled: true },
          confidence: Math.min(0.8, count / 4),
        });
      }
    }
    return results;
  }

  return [];
}
