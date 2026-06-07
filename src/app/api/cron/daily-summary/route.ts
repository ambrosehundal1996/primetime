import { NextRequest, NextResponse } from "next/server";
import {
  generateDailySummary,
  enrichSummaryWithAI,
} from "@/services/summaries";
import { todayStr } from "@/lib/dates";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const date = todayStr();
    const summary = await generateDailySummary(date);
    const enriched = await enrichSummaryWithAI(summary);

    return NextResponse.json({
      date,
      execution_rate: enriched.execution_rate,
      reflection: enriched.reflection,
    });
  } catch (error) {
    console.error("Daily summary cron error:", error);
    return NextResponse.json(
      { error: "Failed to generate daily summary" },
      { status: 500 }
    );
  }
}
