import { Suspense } from "react";
import { getTasksForDay, getTasksForWeek } from "@/services/tasks";
import { calculateDailyMetrics } from "@/services/metrics";
import { groupTasksByPriority, groupTasksByStatus } from "@/services/tasks";
import { todayStr, formatDate, getWeekBounds, isToday } from "@/lib/dates";
import { ExecutionScore } from "@/components/today/execution-score";
import { TaskList } from "@/components/today/task-list";
import { TodayDayNav } from "@/components/today/today-day-nav";

export const dynamic = "force-dynamic";

interface TodayPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function TodayPage({ searchParams }: TodayPageProps) {
  const params = await searchParams;
  const date = params.date ?? todayStr();
  const viewingToday = isToday(date);
  const bounds = getWeekBounds();
  let tasks: Awaited<ReturnType<typeof getTasksForDay>> = [];
  let weekTasks: Awaited<ReturnType<typeof getTasksForWeek>> = [];

  try {
    [tasks, weekTasks] = await Promise.all([
      getTasksForDay(date),
      viewingToday
        ? getTasksForWeek(bounds.startStr, bounds.endStr)
        : Promise.resolve([]),
    ]);
  } catch {
    // Supabase not configured yet — show empty state
  }

  const upcoming = viewingToday
    ? weekTasks.filter(
        (t) =>
          t.task_date > date &&
          !["completed", "missed", "skipped"].includes(t.status)
      )
    : [];

  const metrics = calculateDailyMetrics(tasks);
  const byPriority = groupTasksByPriority(tasks);
  const byStatus = groupTasksByStatus(tasks);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <Suspense fallback={null}>
        <TodayDayNav date={date} />
      </Suspense>

      <ExecutionScore metrics={metrics} />

      {viewingToday && tasks.length === 0 && upcoming.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          No tasks scheduled for today, but you have {upcoming.length} upcoming
          this week. Use → to check future days.
        </div>
      )}

      {!viewingToday && tasks.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500">
          No tasks for {formatDate(date, "MMMM d")}.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <TaskList tasks={byPriority.P0} title="P0 — Critical" />
        <TaskList tasks={byPriority.P1} title="P1 — Important" />
        <TaskList tasks={byStatus.scheduled} title="Scheduled" />
        <TaskList tasks={byStatus.completed} title="Completed" />
        <TaskList tasks={byStatus.missed} title="Missed" />
        <TaskList tasks={byPriority.P2} title="P2 — Nice to Have" />
      </div>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Upcoming This Week ({upcoming.length})
          </h2>
          <div className="space-y-4">
            {Object.entries(
              upcoming.reduce<Record<string, typeof upcoming>>((acc, t) => {
                if (!acc[t.task_date]) acc[t.task_date] = [];
                acc[t.task_date].push(t);
                return acc;
              }, {})
            ).map(([taskDate, dayTasks]) => (
              <div key={taskDate}>
                <p className="mb-2 text-xs font-medium text-gray-500">
                  {formatDate(taskDate, "EEEE, MMM d")}
                </p>
                <TaskList tasks={dayTasks} title="" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
