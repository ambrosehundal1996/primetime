import { Agent, run } from "@openai/agents";
import { allTools } from "@/agent/tools";
import { SYSTEM_PROMPT } from "@/agent/prompts";
import {
  addMessage,
  getMessages,
  createConversation,
} from "@/services/conversations";

export function createExecutionAgent(): Agent {
  return new Agent({
    name: "Primetime",
    instructions: SYSTEM_PROMPT,
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    tools: allTools,
  });
}

export async function runAgentChat(
  message: string,
  conversationId?: string
): Promise<{ response: string; conversationId: string }> {
  let convId = conversationId;

  if (!convId) {
    const conv = await createConversation();
    convId = conv.id;
  }

  await addMessage(convId, "user", message);

  const history = await getMessages(convId);
  const agent = createExecutionAgent();

  const contextMessages = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n\n");

  const result = await run(agent, contextMessages);
  const response =
    typeof result.finalOutput === "string"
      ? result.finalOutput
      : JSON.stringify(result.finalOutput);

  await addMessage(convId, "assistant", response);

  return { response, conversationId: convId };
}
