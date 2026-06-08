"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

interface AddTaskFormProps {
  onSubmit: (title: string, description: string) => Promise<void>;
  compact?: boolean;
}

export function AddTaskForm({ onSubmit, compact }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expanded, setExpanded] = useState(!compact);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmit(title.trim(), description.trim());
      setTitle("");
      setDescription("");
      if (compact) setExpanded(false);
    } finally {
      setLoading(false);
    }
  }

  if (compact && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add a task…
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        autoFocus={expanded}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Details (optional)"
        rows={2}
        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!title.trim() || loading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add task"}
        </button>
        {compact && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
