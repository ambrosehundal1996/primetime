import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">Agent</h1>
        <p className="text-sm text-gray-500">
          Your execution accountability coach
        </p>
      </div>
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  );
}
