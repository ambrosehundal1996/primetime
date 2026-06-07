import { getGoalProgressList } from "@/services/goals";
import { getWeekBounds, formatDate } from "@/lib/dates";
import { GoalCard } from "@/components/goals/goal-card";

export default async function GoalsPage() {
  const bounds = getWeekBounds();
  let progress: Awaited<ReturnType<typeof getGoalProgressList>> = [];

  try {
    progress = await getGoalProgressList();
  } catch {
    // Supabase not configured yet
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

      {progress.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-500">No goals set for this week.</p>
          <p className="text-sm text-gray-400 mt-2">
            Use the Agent chat to create weekly goals, or configure Supabase to get started.
          </p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
