import { getTasksForDay } from "@/services/tasks";
import { calculateDailyMetrics } from "@/services/metrics";
import { groupTasksByPriority, groupTasksByStatus } from "@/services/tasks";
import { todayStr, formatDate } from "@/lib/dates";
import { ExecutionScore } from "@/components/today/execution-score";
import { TaskList } from "@/components/today/task-list";

export default async function TodayPage() {
  const date = todayStr();
  let tasks: Awaited<ReturnType<typeof getTasksForDay>> = [];

  try {
    tasks = await getTasksForDay(date);
  } catch {
    // Supabase not configured yet — show empty state
  }

  const metrics = calculateDailyMetrics(tasks);
  const byPriority = groupTasksByPriority(tasks);
  const byStatus = groupTasksByStatus(tasks);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Today</h1>
        <p className="text-sm text-gray-500">
          {formatDate(date, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <ExecutionScore metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TaskList tasks={byPriority.P0} title="P0 — Critical" />
        <TaskList tasks={byPriority.P1} title="P1 — Important" />
        <TaskList tasks={byStatus.scheduled} title="Scheduled" />
        <TaskList tasks={byStatus.completed} title="Completed" />
        <TaskList tasks={byStatus.missed} title="Missed" />
        <TaskList tasks={byPriority.P2} title="P2 — Nice to Have" />
      </div>
    </div>
  );
}
