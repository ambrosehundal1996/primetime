"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessageAction } from "@/actions/chat";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import type { AgentMessage } from "@/types/database";

const SUGGESTED_PROMPTS = [
  "Plan my day",
  "What should I do next?",
  "Why am I behind?",
  "Summarize today",
  "What patterns are you seeing?",
];

export function ChatInterface({
  initialMessages = [],
  conversationId: initialConversationId,
}: {
  initialMessages?: AgentMessage[];
  conversationId?: string;
}) {
  const [messages, setMessages] = useState<AgentMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text?: string) {
    const message = text ?? input.trim();
    if (!message || loading) return;

    setInput("");
    setLoading(true);

    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      conversation_id: conversationId ?? "",
      role: "user",
      content: message,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await sendChatMessageAction(message, conversationId);
      setConversationId(result.conversationId);

      const assistantMsg: AgentMessage = {
        id: crypto.randomUUID(),
        conversation_id: result.conversationId,
        role: "assistant",
        content: result.response,
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: AgentMessage = {
        id: crypto.randomUUID(),
        conversation_id: conversationId ?? "",
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Execution Accountability Agent
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Ask me to plan your day, track progress, or hold you accountable.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-[80%] ${
                msg.role === "user"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white"
              }`}
            >
              <CardContent className="py-3">
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </CardContent>
            </Card>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <Card className="bg-white">
              <CardContent className="py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your execution..."
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
