import { getGoalProgressList, getAllGoals } from "@/services/goals";
import { getWeekBounds, formatDate, todayStr } from "@/lib/dates";
import { GoalCard } from "@/components/goals/goal-card";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const bounds = getWeekBounds();
  const today = todayStr();
  let progress: Awaited<ReturnType<typeof getGoalProgressList>> = [];
  let error: string | null = null;
  let otherGoals: Awaited<ReturnType<typeof getAllGoals>> = [];

  try {
    progress = await getGoalProgressList();
    if (progress.length === 0) {
      const all = await getAllGoals();
      otherGoals = all.filter(
        (g) => !(g.week_start_date <= today && g.week_end_date >= today)
      );
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load goals";
  }

  const behind = progress.filter((p) => p.pace_status === "behind");
  const onTrack = progress.filter(
    (p) => p.pace_status === "on_track" || p.pace_status === "ahead"
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weekly Goals</h1>
        <p className="text-sm text-gray-500">
          {formatDate(bounds.startStr)} – {formatDate(bounds.endStr)}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">Failed to load goals</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {progress.length === 0 && !error ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center space-y-3">
          <p className="text-gray-500">No goals set for this week.</p>
          <p className="text-sm text-gray-400">
            Showing goals where today ({formatDate(today)}) falls between{" "}
            <code className="text-xs bg-gray-100 px-1 rounded">week_start_date</code> and{" "}
            <code className="text-xs bg-gray-100 px-1 rounded">week_end_date</code>.
          </p>
          <p className="text-sm text-gray-400">
            Expected range: {bounds.startStr} – {bounds.endStr}
          </p>
          {otherGoals.length > 0 && (
            <div className="mt-4 text-left rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">
                Found {otherGoals.length} goal(s) in Supabase outside this week:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                {otherGoals.map((g) => (
                  <li key={g.id}>
                    {g.title} — {g.week_start_date} to {g.week_end_date} ({g.status})
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs">
                Update <code>week_start_date</code> / <code>week_end_date</code> so today
                is included, and set <code>status</code> to <code>active</code>.
              </p>
            </div>
          )}
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
              {behind.length > 0 ? "On Track" : "All Goals"} ({onTrack.length + (behind.length === 0 ? progress.length : onTrack.length)})
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
