export type PendingScheduleChange =
  | {
      kind: "schedule";
      taskId: string;
      taskTitle: string;
      nextTitle: string;
      nextStart: string;
      nextEnd: string;
    }
  | {
      kind: "update";
      taskId: string;
      previousTitle: string;
      nextTitle: string;
      previousStart: string;
      previousEnd: string;
      nextStart: string;
      nextEnd: string;
    }
  | {
      kind: "unschedule";
      taskId: string;
      taskTitle: string;
      previousStart: string;
      previousEnd: string;
    };
