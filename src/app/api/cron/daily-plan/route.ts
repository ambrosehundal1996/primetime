import { NextRequest, NextResponse } from "next/server";
import { generateTasksFromGoals, applyDailyPlan } from "@/services/planning";
import { todayStr } from "@/lib/dates";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const date = todayStr();
    const createdTasks = await generateTasksFromGoals(date);
    const scheduledTasks = await applyDailyPlan(date);

    return NextResponse.json({
      date,
      tasks_created: createdTasks.length,
      tasks_scheduled: scheduledTasks.length,
    });
  } catch (error) {
    console.error("Daily plan cron error:", error);
    return NextResponse.json(
      { error: "Failed to generate daily plan" },
      { status: 500 }
    );
  }
}
