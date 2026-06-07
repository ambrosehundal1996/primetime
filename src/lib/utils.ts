import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function priorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    P0: "Critical",
    P1: "Important",
    P2: "Nice to have",
  };
  return labels[priority] ?? priority;
}

export function priorityColor(priority: string): string {
  const colors: Record<string, string> = {
    P0: "text-red-600 bg-red-50 border-red-200",
    P1: "text-amber-600 bg-amber-50 border-amber-200",
    P2: "text-blue-600 bg-blue-50 border-blue-200",
  };
  return colors[priority] ?? "text-gray-600 bg-gray-50 border-gray-200";
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "text-blue-600 bg-blue-50",
    met: "text-green-600 bg-green-50",
    partially_met: "text-amber-600 bg-amber-50",
    missed: "text-red-600 bg-red-50",
    cancelled: "text-gray-600 bg-gray-50",
    planned: "text-gray-600 bg-gray-50",
    scheduled: "text-indigo-600 bg-indigo-50",
    in_progress: "text-blue-600 bg-blue-50",
    completed: "text-green-600 bg-green-50",
    partially_completed: "text-amber-600 bg-amber-50",
    skipped: "text-gray-500 bg-gray-50",
    rescheduled: "text-purple-600 bg-purple-50",
  };
  return colors[status] ?? "text-gray-600 bg-gray-50";
}
