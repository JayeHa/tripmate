import { useMemo } from "react";

import { tripTags } from "../lib/tags";
import { useExpenses } from "./use-expenses";

/**
 * 이 여행의 비용에 단 태그 — 많이 쓴 순, 대소문자만 다른 것은 처음 본 표기 하나로(tripTags).
 * 비용 목록이 바뀔 때만 다시 센다 — 태그 칸에 칠 때마다 세지 않게. 목록을 아직 못 읽었으면 빈 목록
 */
export function useTripTags(tripId: string) {
  const { data: expenses } = useExpenses(tripId);
  return useMemo(() => tripTags(expenses ?? []), [expenses]);
}
