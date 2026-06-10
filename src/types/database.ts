export type GoalPriority = "P0" | "P1" | "P2";
export type GoalStatus = "active" | "met" | "partially_met" | "missed" | "cancelled";
export type TargetType = "count" | "hours" | "sessions" | "boolean";
export type TaskStatus =
  | "planned"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "partially_completed"
  | "missed"
  | "skipped"
  | "rescheduled";
export type TaskSource = "goal" | "one_time" | "agent";
export type TaskEventType =
  | "created"
  | "scheduled"
  | "started"
  | "paused"
  | "resumed"
  | "completed"
  | "missed"
  | "rescheduled"
  | "edited"
  | "skipped";
export type MessageRole = "user" | "assistant" | "system" | "tool";
export type InsightCategory =
  | "productivity_window"
  | "miss_pattern"
  | "estimation_accuracy"
  | "priority_reliability"
  | "scheduling_habit"
  | "general";

export interface WeeklyGoal {
  id: string;
  title: string;
  description: string | null;
  priority: GoalPriority;
  target_type: TargetType;
  target_value: number;
  current_value: number;
  week_start_date: string;
  week_end_date: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface ActionTask {
  id: string;
  weekly_goal_id: string | null;
  title: string;
  description: string | null;
  priority: GoalPriority;
  task_date: string;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  target_value: number | null;
  completed_value: number | null;
  status: TaskStatus;
  scheduled_start: string | null;
  scheduled_end: string | null;
  google_event_id: string | null;
  completed_at: string | null;
  source: TaskSource;
  created_at: string;
  updated_at: string;
}

export interface TaskEvent {
  id: string;
  action_task_id: string;
  event_type: TaskEventType;
  old_status: TaskStatus | null;
  new_status: TaskStatus | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DailySummary {
  id: string;
  summary_date: string;
  planned: SummaryTaskItem[];
  completed: SummaryTaskItem[];
  missed: SummaryTaskItem[];
  execution_rate: number | null;
  time_analysis: TimeAnalysis;
  reflection: Reflection;
  metrics: DailyMetrics;
  created_at: string;
}

export interface WeeklySummary {
  id: string;
  week_start_date: string;
  week_end_date: string;
  goal_completion: GoalCompletionItem[];
  completion_percentages: Record<string, number>;
  priority_analysis: PriorityAnalysis;
  best_day: string | null;
  worst_day: string | null;
  repeated_misses: RepeatedMiss[];
  time_management_insights: string[];
  recommendations: string[];
  metrics: WeeklyMetrics;
  created_at: string;
}

export interface BehaviorInsight {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  confidence: number;
  is_active: boolean;
  first_observed_at: string;
  last_confirmed_at: string;
  created_at: string;
}

export interface AgentConversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SummaryTaskItem {
  id: string;
  title: string;
  priority: GoalPriority;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  status: TaskStatus;
}

export interface TimeAnalysis {
  total_estimated_minutes: number;
  total_actual_minutes: number;
  estimation_accuracy: number | null;
}

export interface Reflection {
  went_well: string[];
  went_poorly: string[];
  changes_for_tomorrow: string[];
}

export interface GoalCompletionItem {
  goal_id: string;
  title: string;
  priority: GoalPriority;
  target_value: number;
  current_value: number;
  completion_pct: number;
  status: GoalStatus;
}

export interface PriorityAnalysis {
  P0: { planned: number; completed: number; rate: number };
  P1: { planned: number; completed: number; rate: number };
  P2: { planned: number; completed: number; rate: number };
}

export interface RepeatedMiss {
  title: string;
  count: number;
  priority: GoalPriority;
}

export interface DailyMetrics {
  planned_tasks: number;
  completed_tasks: number;
  missed_tasks: number;
  partial_completions: number;
  reschedules: number;
  execution_rate: number;
  planning_accuracy: number | null;
}

export interface WeeklyMetrics {
  planned_tasks: number;
  completed_tasks: number;
  missed_tasks: number;
  execution_score: number;
  weekly_commitment_score: number;
  p0_completion_pct: number;
  p1_completion_pct: number;
  p2_completion_pct: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
}

export interface TimeSlot {
  start: string;
  end: string;
  duration_minutes: number;
}

export interface GoalProgress {
  goal: WeeklyGoal;
  completion_pct: number;
  pace_status: "ahead" | "on_track" | "behind";
  days_remaining: number;
  expected_value: number;
  daily_target: number;
}

export interface DailyPlanRecommendation {
  slot: TimeSlot;
  task: ActionTask;
  reason: string;
}

export type CreateWeeklyGoalInput = Pick<
  WeeklyGoal,
  "title" | "priority" | "target_type" | "target_value" | "week_start_date" | "week_end_date"
> & { description?: string };

export type CreateActionTaskInput = Pick<
  ActionTask,
  "title" | "priority" | "task_date"
> & {
  description?: string;
  weekly_goal_id?: string;
  estimated_minutes?: number;
  target_value?: number;
  source?: TaskSource;
  scheduled_start?: string;
  scheduled_end?: string;
};

export type UpdateTaskStatusInput = {
  task_id: string;
  status: TaskStatus;
  actual_minutes?: number;
  completed_value?: number;
  notes?: string;
};

export type CurrentTaskStatus =
  | "inbox"
  | "in_progress"
  | "completed"
  | "deferred"
  | "cancelled";

export type CurrentTaskSource = "manual" | "voice";

export interface CurrentTask {
  id: string;
  title: string;
  description: string | null;
  status: CurrentTaskStatus;
  is_urgent: boolean | null;
  is_important: boolean | null;
  weekly_goal_id: string | null;
  source: CurrentTaskSource;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type EisenhowerQuadrant =
  | "do_first"
  | "schedule"
  | "delegate"
  | "eliminate";

export interface EisenhowerQuadrantMeta {
  id: EisenhowerQuadrant;
  label: string;
  subtitle: string;
  is_urgent: boolean;
  is_important: boolean;
  color: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export type CreateCurrentTaskInput = {
  title: string;
  description?: string;
  weekly_goal_id?: string;
  source?: CurrentTaskSource;
};

export type UpdateCurrentTaskInput = {
  id: string;
  title?: string;
  description?: string;
  status?: CurrentTaskStatus;
  is_urgent?: boolean | null;
  is_important?: boolean | null;
  weekly_goal_id?: string | null;
};

export function getQuadrant(
  task: CurrentTask
): EisenhowerQuadrant | null {
  if (task.is_urgent === null || task.is_important === null) return null;
  if (task.is_urgent && task.is_important) return "do_first";
  if (!task.is_urgent && task.is_important) return "schedule";
  if (task.is_urgent && !task.is_important) return "delegate";
  return "eliminate";
}

export function isPrioritized(task: CurrentTask): boolean {
  return task.is_urgent !== null && task.is_important !== null;
}

export const EISENHOWER_QUADRANTS: EisenhowerQuadrantMeta[] = [
  {
    id: "do_first",
    label: "Do First",
    subtitle: "Urgent & Important",
    is_urgent: true,
    is_important: true,
    color: "border-red-200 bg-red-50",
    position: "top-left",
  },
  {
    id: "schedule",
    label: "Schedule",
    subtitle: "Important, Not Urgent",
    is_urgent: false,
    is_important: true,
    color: "border-blue-200 bg-blue-50",
    position: "top-right",
  },
  {
    id: "delegate",
    label: "Delegate",
    subtitle: "Urgent, Not Important",
    is_urgent: true,
    is_important: false,
    color: "border-amber-200 bg-amber-50",
    position: "bottom-left",
  },
  {
    id: "eliminate",
    label: "Eliminate",
    subtitle: "Not Urgent, Not Important",
    is_urgent: false,
    is_important: false,
    color: "border-gray-200 bg-gray-50",
    position: "bottom-right",
  },
];
