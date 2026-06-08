import { getCurrentTasks } from "@/services/current-tasks";
import { CurrentTasksBoard } from "@/components/current-tasks/current-tasks-board";

export default async function CurrentTasksPage() {
  let tasks: Awaited<ReturnType<typeof getCurrentTasks>> = [];

  try {
    tasks = await getCurrentTasks();
  } catch {
    // Supabase not configured or migration not run
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Current Tasks</h1>
        <p className="text-sm text-gray-500">
          Everything on your mind — capture, prioritize, execute.
        </p>
      </div>
      <CurrentTasksBoard initialTasks={tasks} />
    </div>
  );
}
