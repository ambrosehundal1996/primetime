import { NextRequest, NextResponse } from "next/server";
import { generateWeeklySummary } from "@/services/summaries";
import { generateInsightsFromHistory } from "@/services/insights";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await generateWeeklySummary();
    const insights = await generateInsightsFromHistory();

    return NextResponse.json({
      week: `${summary.week_start_date} - ${summary.week_end_date}`,
      execution_score: summary.metrics.execution_score,
      insights_generated: insights.length,
    });
  } catch (error) {
    console.error("Weekly summary cron error:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly summary" },
      { status: 500 }
    );
  }
}
