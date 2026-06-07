import { createServerClient } from "@/lib/supabase/server";
import type { AgentConversation, AgentMessage, MessageRole } from "@/types/database";

export async function createConversation(
  title?: string
): Promise<AgentConversation> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_conversations")
    .insert({ title: title ?? "New Conversation" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getConversations(): Promise<AgentConversation[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_conversations")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getConversation(
  id: string
): Promise<AgentConversation | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getMessages(
  conversationId: string
): Promise<AgentMessage[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  metadata?: Record<string, unknown>
): Promise<AgentMessage> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      metadata: metadata ?? {},
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from("agent_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data;
}
