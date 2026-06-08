import { getCalendarEvents, findAvailableSlots, allocateSlot } from "@/services/calendar";
import { getGoalsBehindPace, getGoalProgressList } from "@/services/goals";
import { getIncompleteTasks, sortTasksByPriority, createTask } from "@/services/tasks";
import { todayStr } from "@/lib/dates";
import type { ActionTask, DailyPlanRecommendation, GoalProgress } from "@/types/database";

export async function generateDailyPlan(
  date: string = todayStr()
): Promise<{
  date: string;
  available_slots: { start: string; end: string; duration_minutes: number }[];
  recommendations: DailyPlanRecommendation[];
  behind_pace_goals: GoalProgress[];
  unscheduled_tasks: ActionTask[];
}> {
  const [calendarResult, incompleteTasks, behindGoals, allProgress] = await Promise.all([
    getCalendarEvents(date),
    getIncompleteTasks(date),
    getGoalsBehindPace(),
    getGoalProgressList(),
  ]);

  const events = calendarResult.events;
  const slots = findAvailableSlots(events, date);
  const sorted = sortTasksByPriority(incompleteTasks);
  const unscheduled = sorted.filter((t) => !t.scheduled_start);

  const recommendations: DailyPlanRecommendation[] = [];
  const usedSlots = [...slots];

  for (const task of unscheduled) {
    const minutesNeeded = task.estimated_minutes ?? 60;
    const allocation = allocateSlot(usedSlots, minutesNeeded);
    if (!allocation) continue;

    const reason = buildRecommendationReason(task, behindGoals, allProgress);
    const slotIndex = usedSlots.findIndex(
      (s) => s.start === allocation.start.slice(0, 19)
    );

    recommendations.push({
      slot: {
        start: allocation.start,
        end: allocation.end,
        duration_minutes: minutesNeeded,
      },
      task,
      reason,
    });

    if (slotIndex >= 0) {
      const remaining = usedSlots[slotIndex].duration_minutes - minutesNeeded;
      if (remaining >= 30) {
        const newStart = allocation.end;
        usedSlots[slotIndex] = {
          start: newStart,
          end: usedSlots[slotIndex].end,
          duration_minutes: remaining,
        };
      } else {
        usedSlots.splice(slotIndex, 1);
      }
    }
  }

  return {
    date,
    available_slots: slots,
    recommendations,
    behind_pace_goals: behindGoals,
    unscheduled_tasks: unscheduled,
  };
}

function buildRecommendationReason(
  task: ActionTask,
  behindGoals: GoalProgress[],
  allProgress: GoalProgress[]
): string {
  if (task.weekly_goal_id) {
    const goalProgress = allProgress.find(
      (p) => p.goal.id === task.weekly_goal_id
    );
    if (goalProgress?.pace_status === "behind") {
      return `${goalProgress.goal.title} is behind target pace (${Math.round(goalProgress.completion_pct * 100)}% complete, expected ${Math.round(goalProgress.expected_value)}).`;
    }
    if (goalProgress) {
      return `Supports ${goalProgress.goal.title} — daily target: ${goalProgress.daily_target.toFixed(1)} remaining.`;
    }
  }

  const behindP0 = behindGoals.find((g) => g.goal.priority === "P0");
  if (behindP0 && task.priority === "P0") {
    return `P0 priority — ${behindP0.goal.title} needs attention this week.`;
  }

  return `${task.priority} task scheduled to maintain weekly commitments.`;
}

export async function applyDailyPlan(
  date: string = todayStr()
): Promise<ActionTask[]> {
  const plan = await generateDailyPlan(date);
  const scheduled: ActionTask[] = [];

  for (const rec of plan.recommendations) {
    const { scheduleTask } = await import("@/services/tasks");
    const updated = await scheduleTask(
      rec.task.id,
      rec.slot.start,
      rec.slot.end
    );
    scheduled.push(updated);
  }

  return scheduled;
}

export async function generateTasksFromGoals(
  date: string = todayStr()
): Promise<ActionTask[]> {
  const progress = await getGoalProgressList();
  const created: ActionTask[] = [];

  for (const p of progress) {
    if (p.goal.status !== "active") continue;
    if (p.daily_target <= 0) continue;

    const task = await createTask({
      title: p.goal.title,
      description: `Daily target: ${p.daily_target.toFixed(1)} ${p.goal.target_type}`,
      priority: p.goal.priority,
      task_date: date,
      weekly_goal_id: p.goal.id,
      estimated_minutes:
        p.goal.target_type === "hours" ? Math.round(p.daily_target * 60) : 60,
      target_value: p.daily_target,
      source: "goal",
    });
    created.push(task);
  }

  return created;
}
