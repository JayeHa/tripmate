import { useState } from "react";

import type { ExpenseFormValues } from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import { todayISO } from "@/shared/lib/days";

import { autoTime, nowTime } from "../lib/spent-time";

type SpentTimeOptions = {
  /** 수정이면 저장된 값 — 저장된 시각(없으면 빈 칸)을 그대로 두고 자동으로 채우지 않는다 */
  initial?: ExpenseFormValues;
  spentOn: string;
  /** 지금 연결한 일정 */
  linked: ScheduleItem | null;
};

/**
 * 비용의 시간 칸(선택, #288). 사용자가 고치기 전에는 자동값을 따라간다 — 연결한 일정의 시간, 아니면 쓴 날이 오늘이면 폼을 연 시각(autoTime).
 * 한 번 고치면(✕ 로 비운 것 포함) 그 값을 둔다. 여행준비면 빈 칸이고 저장하지 않는다
 */
export function useSpentTime({ initial, spentOn, linked }: SpentTimeOptions) {
  const [now] = useState(nowTime);
  // null = 아직 고치지 않음
  const [manual, setManual] = useState<string | null>(initial ? (initial.spent_time ?? "") : null);
  const auto = autoTime({ spentOn, itemTime: linked?.start_time ?? null, today: todayISO(), now });
  const time = spentOn ? (manual ?? auto) : "";
  return { time, setTime: setManual };
}
