import { createServerClient } from "@/lib/supabase/server";
import type {
  CreateCurrentTaskInput,
  CurrentTask,
  UpdateCurrentTaskInput,
} from "@/types/database";

export async function getCurrentTasks(
  includeCompleted = false
): Promise<CurrentTask[]> {
  const supabase = createServerClient();
  let query = supabase
    .from("current_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (!includeCompleted) {
    query = query.not("status", "in", "(completed,cancelled)");
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCurrentTaskById(
  id: string
): Promise<CurrentTask | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("current_tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createCurrentTask(
  input: CreateCurrentTaskInput
): Promise<CurrentTask> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("current_tasks")
    .insert({
      title: input.title,
      description: input.description ?? null,
      weekly_goal_id: input.weekly_goal_id ?? null,
      source: input.source ?? "manual",
      status: "inbox",
      is_urgent: null,
      is_important: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCurrentTask(
  input: UpdateCurrentTaskInput
): Promise<CurrentTask> {
  const supabase = createServerClient();
  const { id, ...updates } = input;

  const payload: Record<string, unknown> = { ...updates };

  if (updates.status === "completed") {
    payload.completed_at = new Date().toISOString();
  }
  if (updates.status && updates.status !== "completed") {
    payload.completed_at = null;
  }

  const { data, error } = await supabase
    .from("current_tasks")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function assignPriority(
  id: string,
  isUrgent: boolean,
  isImportant: boolean
): Promise<CurrentTask> {
  return updateCurrentTask({
    id,
    is_urgent: isUrgent,
    is_important: isImportant,
  });
}

export async function clearPriority(id: string): Promise<CurrentTask> {
  return updateCurrentTask({
    id,
    is_urgent: null,
    is_important: null,
  });
}

export async function deleteCurrentTask(id: string): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.from("current_tasks").delete().eq("id", id);
  if (error) throw error;
}
