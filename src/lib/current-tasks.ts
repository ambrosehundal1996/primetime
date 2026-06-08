import {
  getQuadrant,
  isPrioritized,
  type CurrentTask,
  type EisenhowerQuadrant,
} from "@/types/database";

export function partitionCurrentTasks(tasks: CurrentTask[]): {
  unprioritized: CurrentTask[];
  byQuadrant: Record<EisenhowerQuadrant, CurrentTask[]>;
} {
  const unprioritized: CurrentTask[] = [];
  const byQuadrant: Record<EisenhowerQuadrant, CurrentTask[]> = {
    do_first: [],
    schedule: [],
    delegate: [],
    eliminate: [],
  };

  for (const task of tasks) {
    if (!isPrioritized(task)) {
      unprioritized.push(task);
      continue;
    }
    const quadrant = getQuadrant(task);
    if (quadrant) byQuadrant[quadrant].push(task);
  }

  return { unprioritized, byQuadrant };
}
