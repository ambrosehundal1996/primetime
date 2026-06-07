import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatPercent } from "@/lib/utils";
import type { GoalProgress } from "@/types/database";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface GoalCardProps {
  progress: GoalProgress;
}

function PaceIcon({ status }: { status: string }) {
  switch (status) {
    case "ahead":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "behind":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-400" />;
  }
}

export function GoalCard({ progress }: GoalCardProps) {
  const { goal } = progress;
  const barColor =
    progress.pace_status === "ahead"
      ? "green"
      : progress.pace_status === "behind"
        ? "red"
        : "blue";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>{goal.title}</CardTitle>
          <Badge variant="priority" value={goal.priority}>
            {goal.priority}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <PaceIcon status={progress.pace_status} />
          <span className="text-xs text-gray-500 capitalize">
            {progress.pace_status.replace("_", " ")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProgressBar
          value={progress.completion_pct}
          label={`${goal.current_value} / ${goal.target_value} ${goal.target_type}`}
          color={barColor}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            Daily target: {progress.daily_target.toFixed(1)} remaining
          </span>
          <span>{progress.days_remaining} days left</span>
        </div>
        <Badge variant="status" value={goal.status}>
          {goal.status.replace("_", " ")}
        </Badge>
      </CardContent>
    </Card>
  );
}
