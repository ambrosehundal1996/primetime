import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";
import type { DailyMetrics } from "@/types/database";

interface ExecutionScoreProps {
  metrics: DailyMetrics;
}

export function ExecutionScore({ metrics }: ExecutionScoreProps) {
  const scoreColor =
    metrics.execution_rate >= 0.8
      ? "text-green-600"
      : metrics.execution_rate >= 0.5
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Execution Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold ${scoreColor}`}>
            {formatPercent(metrics.execution_rate)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.completed_tasks} of {metrics.planned_tasks} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Missed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-600">
            {metrics.missed_tasks}
          </p>
          <p className="text-xs text-gray-500 mt-1">tasks not completed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partial</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-amber-600">
            {metrics.partial_completions}
          </p>
          <p className="text-xs text-gray-500 mt-1">partially completed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planning Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">
            {metrics.planning_accuracy !== null
              ? formatPercent(metrics.planning_accuracy)
              : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">estimated vs actual time</p>
        </CardContent>
      </Card>
    </div>
  );
}
