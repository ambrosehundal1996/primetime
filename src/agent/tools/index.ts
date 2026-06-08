import { tool } from "@openai/agents";
import { z } from "zod";
import {
  getActiveGoals,
  getGoalsForWeek,
  getGoalProgressList,
  createGoal,
} from "@/services/goals";
import {
  getTasksForDay,
  getTasksForWeek,
  createTask,
  updateTaskStatus,
  logTaskProgress,
} from "@/services/tasks";
import { getWeekBounds } from "@/lib/dates";
import { getCalendarEvents, findAvailableSlots } from "@/services/calendar";
import { generateDailyPlan } from "@/services/planning";
import {
  generateDailySummary,
  generateWeeklySummary,
} from "@/services/summaries";
import { getBehaviorInsights } from "@/services/insights";
import { todayStr } from "@/lib/dates";

export const getActiveGoalsTool = tool({
  name: "get_active_goals",
  description:
    "Get all active weekly goals for the current week with their progress, status, and priority.",
  parameters: z.object({
    week_start: z
      .string()
      .nullable()
      .describe("Week start date (YYYY-MM-DD). Defaults to current week."),
  }),
  execute: async ({ week_start }) => {
    const bounds = getWeekBounds();
    const goals = week_start
      ? await getGoalsForWeek(week_start, bounds.endStr)
      : await getActiveGoals();
    return JSON.stringify(goals);
  },
});

export const getTasksForDayTool = tool({
  name: "get_tasks_for_day",
  description:
    "Get all action tasks for a specific day, including status, priority, and scheduling info.",
  parameters: z.object({
    date: z
      .string()
      .nullable()
      .describe("Date (YYYY-MM-DD). Defaults to today."),
  }),
  execute: async ({ date }) => {
    const tasks = await getTasksForDay(date ?? todayStr());
    return JSON.stringify(tasks);
  },
});

export const getGoalProgressTool = tool({
  name: "get_goal_progress",
  description:
    "Get detailed progress for all weekly goals including pace status (ahead/on_track/behind), completion %, and daily targets.",
  parameters: z.object({
    week_start: z.string().nullable(),
  }),
  execute: async ({ week_start }) => {
    const progress = await getGoalProgressList(week_start ?? undefined);
    return JSON.stringify(progress);
  },
});

export const getCalendarAvailabilityTool = tool({
  name: "get_calendar_availability",
  description:
    "Read Google Calendar events and find available time slots for a given day. Calendar is read-only.",
  parameters: z.object({
    date: z
      .string()
      .nullable()
      .describe("Date (YYYY-MM-DD). Defaults to today."),
  }),
  execute: async ({ date }) => {
    const d = date ?? todayStr();
    const { events, error } = await getCalendarEvents(d);
    const slots = findAvailableSlots(events, d);
    return JSON.stringify({ date: d, events, available_slots: slots, error });
  },
});

export const createWeeklyGoalTool = tool({
  name: "create_weekly_goal",
  description:
    "Create a weekly goal for the current week. ALWAYS use this before creating tasks that support a weekly commitment. Returns the goal with its id — pass that id as weekly_goal_id when creating related action tasks.",
  parameters: z.object({
    title: z.string(),
    description: z.string().nullable(),
    priority: z.enum(["P0", "P1", "P2"]),
    target_type: z.enum(["count", "hours", "sessions", "boolean"]),
    target_value: z.number(),
    week_start_date: z
      .string()
      .nullable()
      .describe("Monday of the week (YYYY-MM-DD). Defaults to current week."),
    week_end_date: z
      .string()
      .nullable()
      .describe("Sunday of the week (YYYY-MM-DD). Defaults to current week."),
  }),
  execute: async (input) => {
    const bounds = getWeekBounds();
    const goal = await createGoal({
      title: input.title,
      description: input.description ?? undefined,
      priority: input.priority,
      target_type: input.target_type,
      target_value: input.target_value,
      week_start_date: input.week_start_date ?? bounds.startStr,
      week_end_date: input.week_end_date ?? bounds.endStr,
    });
    return JSON.stringify(goal);
  },
});

export const getTasksForWeekTool = tool({
  name: "get_tasks_for_week",
  description: "Get all action tasks for the current week (or a specific week).",
  parameters: z.object({
    week_start: z.string().nullable(),
    week_end: z.string().nullable(),
  }),
  execute: async ({ week_start, week_end }) => {
    const bounds = getWeekBounds();
    const tasks = await getTasksForWeek(
      week_start ?? bounds.startStr,
      week_end ?? bounds.endStr
    );
    return JSON.stringify(tasks);
  },
});

export const createTaskTool = tool({
  name: "create_task",
  description:
    "Create a daily action task. When the task supports a weekly goal, you MUST pass weekly_goal_id from create_weekly_goal. Tasks from goals inherit the goal's priority.",
  parameters: z.object({
    title: z.string(),
    task_date: z.string(),
    priority: z.enum(["P0", "P1", "P2"]).nullable(),
    description: z.string().nullable(),
    weekly_goal_id: z.string().nullable(),
    estimated_minutes: z.number().nullable(),
    target_value: z.number().nullable(),
    source: z.enum(["goal", "one_time", "agent"]).nullable(),
  }),
  execute: async (input) => {
    const task = await createTask({
      title: input.title,
      task_date: input.task_date,
      priority: input.priority ?? "P1",
      description: input.description ?? undefined,
      weekly_goal_id: input.weekly_goal_id ?? undefined,
      estimated_minutes: input.estimated_minutes ?? undefined,
      target_value: input.target_value ?? undefined,
      source: input.source ?? "agent",
    });
    return JSON.stringify(task);
  },
});

export const updateTaskStatusTool = tool({
  name: "update_task_status",
  description:
    "Update a task's status. Records an audit trail event. Use for marking complete, missed, skipped, rescheduled, etc.",
  parameters: z.object({
    task_id: z.string(),
    status: z.enum([
      "planned",
      "scheduled",
      "in_progress",
      "completed",
      "partially_completed",
      "missed",
      "skipped",
      "rescheduled",
    ]),
    actual_minutes: z.number().nullable(),
    completed_value: z.number().nullable(),
    notes: z.string().nullable(),
  }),
  execute: async (input) => {
    const task = await updateTaskStatus({
      task_id: input.task_id,
      status: input.status,
      actual_minutes: input.actual_minutes ?? undefined,
      completed_value: input.completed_value ?? undefined,
      notes: input.notes ?? undefined,
    });
    return JSON.stringify(task);
  },
});

export const logTaskProgressTool = tool({
  name: "log_task_progress",
  description:
    "Log partial or full progress on a task. Automatically determines completed vs partially_completed status.",
  parameters: z.object({
    task_id: z.string(),
    completed_value: z.number(),
    actual_minutes: z.number().nullable(),
  }),
  execute: async (input) => {
    const task = await logTaskProgress(
      input.task_id,
      input.completed_value,
      input.actual_minutes ?? undefined
    );
    return JSON.stringify(task);
  },
});

export const generateDailyPlanTool = tool({
  name: "generate_daily_plan",
  description:
    "Generate a recommended daily schedule by matching unscheduled tasks to available calendar slots. Returns recommendations with reasoning.",
  parameters: z.object({
    date: z.string().nullable(),
  }),
  execute: async ({ date }) => {
    const plan = await generateDailyPlan(date ?? todayStr());
    return JSON.stringify(plan);
  },
});

export const generateDailySummaryTool = tool({
  name: "generate_daily_summary",
  description:
    "Generate an end-of-day execution summary with planned vs completed vs missed, execution rate, and time analysis.",
  parameters: z.object({
    date: z.string().nullable(),
  }),
  execute: async ({ date }) => {
    const summary = await generateDailySummary(date ?? todayStr());
    return JSON.stringify(summary);
  },
});

export const generateWeeklySummaryTool = tool({
  name: "generate_weekly_summary",
  description:
    "Generate a weekly execution summary with goal completion, priority analysis, best/worst days, and repeated misses.",
  parameters: z.object({
    week_start: z.string().nullable(),
  }),
  execute: async ({ week_start }) => {
    const summary = await generateWeeklySummary(week_start ?? undefined);
    return JSON.stringify(summary);
  },
});

export const getBehaviorInsightsTool = tool({
  name: "get_behavior_insights",
  description:
    "Get long-term behavioral insights about execution habits, productivity patterns, and estimation accuracy.",
  parameters: z.object({}),
  execute: async () => {
    const insights = await getBehaviorInsights();
    return JSON.stringify(insights);
  },
});

export const allTools = [
  getActiveGoalsTool,
  getTasksForDayTool,
  getTasksForWeekTool,
  getGoalProgressTool,
  getCalendarAvailabilityTool,
  createWeeklyGoalTool,
  createTaskTool,
  updateTaskStatusTool,
  logTaskProgressTool,
  generateDailyPlanTool,
  generateDailySummaryTool,
  generateWeeklySummaryTool,
  getBehaviorInsightsTool,
];
