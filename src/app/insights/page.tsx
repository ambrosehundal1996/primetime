import { getBehaviorInsights } from "@/services/insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";

export default async function InsightsPage() {
  let insights: Awaited<ReturnType<typeof getBehaviorInsights>> = [];

  try {
    insights = await getBehaviorInsights();
  } catch {
    // Supabase not configured yet
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Behavioral Insights</h1>
        <p className="text-sm text-gray-500">
          Long-term patterns about your execution habits
        </p>
      </div>

      {insights.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <Lightbulb className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No insights yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Insights are generated from your execution history after a week of tracking.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{insight.title}</CardTitle>
                <Badge variant="default">
                  {Math.round(insight.confidence * 100)}% confidence
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{insight.description}</p>
                <p className="text-xs text-gray-400 mt-2 capitalize">
                  {insight.category.replace("_", " ")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
