"use server";

import { runAgentChat } from "@/agent";
import { getConversations, getMessages } from "@/services/conversations";

export async function sendChatMessageAction(
  message: string,
  conversationId?: string
) {
  return runAgentChat(message, conversationId);
}

export async function fetchConversationsAction() {
  return getConversations();
}

export async function fetchMessagesAction(conversationId: string) {
  return getMessages(conversationId);
}
