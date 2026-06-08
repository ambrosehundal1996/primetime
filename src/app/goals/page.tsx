import { Suspense } from "react";
import { getGoalProgressList } from "@/services/goals";
import {
  getWeekBoundsForDate,
  todayStr,
  isCurrentWeek,
} from "@/lib/dates";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalsWeekNav } from "@/components/goals/goals-week-nav";

export const dynamic = "force-dynamic";

interface GoalsPageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function GoalsPage({ searchParams }: GoalsPageProps) {
  const params = await searchParams;
  const anchorDate = params.week ?? todayStr();
  const week = getWeekBoundsForDate(anchorDate);
  const viewingCurrentWeek = isCurrentWeek(anchorDate);

  let progress: Awaited<ReturnType<typeof getGoalProgressList>> = [];
  let error: string | null = null;

  try {
    progress = await getGoalProgressList(week.startStr, week.endStr);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load goals";
  }

  const behind = progress.filter((p) => p.pace_status === "behind");
  const onTrack = progress.filter(
    (p) => p.pace_status === "on_track" || p.pace_status === "ahead"
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <Suspense fallback={null}>
        <GoalsWeekNav date={anchorDate} />
      </Suspense>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">Failed to load goals</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {progress.length === 0 && !error ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center space-y-3">
          <p className="text-gray-500">
            No goals for{" "}
            {viewingCurrentWeek ? "this week" : "the selected week"}.
          </p>
          <p className="text-sm text-gray-400">
            Use the Agent to create weekly goals, or navigate to another week.
          </p>
        </div>
      ) : progress.length > 0 ? (
        <>
          {behind.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-red-600 mb-3">
                Behind Pace ({behind.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {behind.map((p) => (
                  <GoalCard key={p.goal.id} progress={p} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {behind.length > 0 ? "On Track" : "All Goals"} (
              {behind.length > 0 ? onTrack.length : progress.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(behind.length > 0 ? onTrack : progress).map((p) => (
                <GoalCard key={p.goal.id} progress={p} />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
