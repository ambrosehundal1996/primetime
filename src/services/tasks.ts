import { createServerClient } from "@/lib/supabase/server";
import { todayStr } from "@/lib/dates";
import type {
  ActionTask,
  CreateActionTaskInput,
  GoalPriority,
  TaskStatus,
  UpdateTaskStatusInput,
} from "@/types/database";

const PRIORITY_ORDER: Record<GoalPriority, number> = { P0: 0, P1: 1, P2: 2 };

export async function getTasksForDay(date: string = todayStr()): Promise<ActionTask[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("action_tasks")
    .select("*")
    .eq("task_date", date)
    .order("priority", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getIncompleteTasks(
  date: string = todayStr()
): Promise<ActionTask[]> {
  const tasks = await getTasksForDay(date);
  return tasks.filter(
    (t) => !["completed", "missed", "skipped"].includes(t.status)
  );
}

export async function getTasksForWeek(
  weekStart: string,
  weekEnd: string
): Promise<ActionTask[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("action_tasks")
    .select("*")
    .gte("task_date", weekStart)
    .lte("task_date", weekEnd)
    .order("task_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getTaskById(id: string): Promise<ActionTask | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("action_tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createTask(
  input: CreateActionTaskInput
): Promise<ActionTask> {
  const supabase = createServerClient();

  if (input.weekly_goal_id) {
    const { data: goal } = await supabase
      .from("weekly_goals")
      .select("priority")
      .eq("id", input.weekly_goal_id)
      .single();

    if (goal) {
      input.priority = goal.priority;
    }
  }

  const status: TaskStatus = input.scheduled_start ? "scheduled" : "planned";

  const { data, error } = await supabase
    .from("action_tasks")
    .insert({ ...input, status })
    .select()
    .single();

  if (error) throw error;

  await recordTaskEvent(data.id, "created", null, status, "Task created");
  if (status === "scheduled") {
    await recordTaskEvent(
      data.id,
      "scheduled",
      "planned",
      "scheduled",
      "Task scheduled on creation"
    );
  }

  return data;
}

export async function updateTaskStatus(
  input: UpdateTaskStatusInput
): Promise<ActionTask> {
  const supabase = createServerClient();
  const task = await getTaskById(input.task_id);
  if (!task) throw new Error("Task not found");

  const updates: Partial<ActionTask> = { status: input.status };

  if (input.actual_minutes !== undefined) {
    updates.actual_minutes = input.actual_minutes;
  }
  if (input.completed_value !== undefined) {
    updates.completed_value = input.completed_value;
  }
  if (input.status === "completed" || input.status === "partially_completed") {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("action_tasks")
    .update(updates)
    .eq("id", input.task_id)
    .select()
    .single();

  if (error) throw error;

  const eventType = mapStatusToEventType(input.status);
  await recordTaskEvent(
    input.task_id,
    eventType,
    task.status,
    input.status,
    input.notes
  );

  await syncGoalProgressFromTask(task, input, data);

  return data;
}

async function syncGoalProgressFromTask(
  task: ActionTask,
  input: UpdateTaskStatusInput,
  updated: ActionTask
): Promise<void> {
  if (!task.weekly_goal_id) return;
  if (!["completed", "partially_completed"].includes(input.status)) return;

  const previous = task.completed_value ?? 0;
  const current = updated.completed_value ?? input.completed_value ?? 0;
  const delta = current - previous;

  if (delta > 0) {
    const { updateGoalProgress } = await import("@/services/goals");
    await updateGoalProgress(task.weekly_goal_id, delta);
  }
}

export async function logTaskProgress(
  taskId: string,
  completedValue: number,
  actualMinutes?: number
): Promise<ActionTask> {
  const task = await getTaskById(taskId);
  if (!task) throw new Error("Task not found");

  const target = task.target_value ?? 1;
  const status: TaskStatus =
    completedValue >= target ? "completed" : "partially_completed";

  return updateTaskStatus({
    task_id: taskId,
    status,
    completed_value: completedValue,
    actual_minutes: actualMinutes,
    notes: `Progress logged: ${completedValue}/${target}`,
  });
}

export async function scheduleTask(
  taskId: string,
  scheduledStart: string,
  scheduledEnd: string,
  googleEventId?: string | null
): Promise<ActionTask> {
  const supabase = createServerClient();
  const task = await getTaskById(taskId);
  if (!task) throw new Error("Task not found");

  const update: Record<string, unknown> = {
    scheduled_start: scheduledStart,
    scheduled_end: scheduledEnd,
    status: "scheduled",
  };
  if (googleEventId !== undefined) {
    update.google_event_id = googleEventId;
  }

  const { data, error } = await supabase
    .from("action_tasks")
    .update(update)
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;

  await recordTaskEvent(
    taskId,
    "scheduled",
    task.status,
    "scheduled",
    `Scheduled ${scheduledStart} - ${scheduledEnd}`
  );

  return data;
}

export async function scheduleTaskWithCalendar(
  taskId: string,
  scheduledStart: string,
  scheduledEnd: string
): Promise<ActionTask> {
  const task = await getTaskById(taskId);
  if (!task) throw new Error("Task not found");

  const { upsertCalendarEvent } = await import("@/services/calendar");
  const { eventId, error } = await upsertCalendarEvent({
    title: task.title,
    description: task.description ?? `Primetime · ${task.priority}`,
    start: scheduledStart,
    end: scheduledEnd,
    existingEventId: task.google_event_id,
  });

  if (error) {
    throw new Error(
      error.includes("insufficient") || error.includes("Insufficient")
        ? "Google Calendar write access required. Re-authorize with calendar.events scope — see docs/GOOGLE_CALENDAR_SETUP.md"
        : `Failed to create Google Calendar event: ${error}`
    );
  }

  return scheduleTask(taskId, scheduledStart, scheduledEnd, eventId);
}

export async function updateScheduledTaskWithCalendar(
  taskId: string,
  input: {
    title?: string;
    scheduledStart: string;
    scheduledEnd: string;
  }
): Promise<ActionTask> {
  const task = await getTaskById(taskId);
  if (!task) throw new Error("Task not found");

  const title = input.title?.trim() || task.title;
  const durationMinutes = Math.max(
    15,
    Math.round(
      (new Date(input.scheduledEnd).getTime() -
        new Date(input.scheduledStart).getTime()) /
        60000
    )
  );

  const { upsertCalendarEvent } = await import("@/services/calendar");
  const { eventId, error } = await upsertCalendarEvent({
    title,
    description: task.description ?? `Primetime · ${task.priority}`,
    start: input.scheduledStart,
    end: input.scheduledEnd,
    existingEventId: task.google_event_id,
  });

  if (error) {
    throw new Error(`Failed to update Google Calendar event: ${error}`);
  }

  const supabase = createServerClient();
  const { data, error: dbError } = await supabase
    .from("action_tasks")
    .update({
      title,
      scheduled_start: input.scheduledStart,
      scheduled_end: input.scheduledEnd,
      estimated_minutes: durationMinutes,
      status: "scheduled",
      google_event_id: eventId ?? task.google_event_id,
    })
    .eq("id", taskId)
    .select()
    .single();

  if (dbError) throw dbError;

  await recordTaskEvent(
    taskId,
    "scheduled",
    task.status,
    "scheduled",
    `Rescheduled ${input.scheduledStart} - ${input.scheduledEnd}`
  );

  return data;
}

export async function unscheduleTaskWithCalendar(
  taskId: string
): Promise<ActionTask> {
  const task = await getTaskById(taskId);
  if (!task) throw new Error("Task not found");

  if (task.google_event_id) {
    const { deleteCalendarEvent } = await import("@/services/calendar");
    const { error } = await deleteCalendarEvent(task.google_event_id);
    if (error) {
      throw new Error(`Failed to remove Google Calendar event: ${error}`);
    }
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("action_tasks")
    .update({
      scheduled_start: null,
      scheduled_end: null,
      google_event_id: null,
      status: "planned",
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;

  await recordTaskEvent(
    taskId,
    "scheduled",
    task.status,
    "planned",
    "Removed from calendar schedule"
  );

  return data;
}

export function sortTasksByPriority(tasks: ActionTask[]): ActionTask[] {
  return [...tasks].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );
}

export function groupTasksByPriority(
  tasks: ActionTask[]
): Record<GoalPriority, ActionTask[]> {
  return {
    P0: tasks.filter((t) => t.priority === "P0"),
    P1: tasks.filter((t) => t.priority === "P1"),
    P2: tasks.filter((t) => t.priority === "P2"),
  };
}

export function groupTasksByStatus(
  tasks: ActionTask[]
): Record<string, ActionTask[]> {
  const groups: Record<string, ActionTask[]> = {
    scheduled: [],
    in_progress: [],
    planned: [],
    completed: [],
    missed: [],
    other: [],
  };

  for (const task of tasks) {
    if (groups[task.status]) {
      groups[task.status].push(task);
    } else {
      groups.other.push(task);
    }
  }

  return groups;
}

async function recordTaskEvent(
  taskId: string,
  eventType: string,
  oldStatus: TaskStatus | null,
  newStatus: TaskStatus | null,
  notes?: string
): Promise<void> {
  const supabase = createServerClient();
  await supabase.from("task_events").insert({
    action_task_id: taskId,
    event_type: eventType,
    old_status: oldStatus,
    new_status: newStatus,
    notes,
  });
}

function mapStatusToEventType(status: TaskStatus): string {
  const map: Record<string, string> = {
    in_progress: "started",
    completed: "completed",
    missed: "missed",
    rescheduled: "rescheduled",
    skipped: "skipped",
    scheduled: "scheduled",
  };
  return map[status] ?? "edited";
}
