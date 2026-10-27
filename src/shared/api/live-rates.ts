"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import type { LiveRates } from "@/shared/lib/money";

import { queryKeys } from "./query-keys";

/** 하루 한 번 바뀌는 값이라 반나절 동안 다시 받지 않는다 */
const HALF_DAY = 12 * 60 * 60 * 1000;

/** 실시간 환율을 서버 라우트에서 받는다. 실패하면 던진다(화면은 「지금」 값을 뺀다) */
async function fetchLiveRates(base: string): Promise<LiveRates> {
  const res = await fetch(`/api/live-rates?base=${encodeURIComponent(base)}`);
  if (!res.ok) throw new Error(`live-rates ${res.status}`);
  return (await res.json()) as LiveRates;
}

/** 실시간 환율의 조회 정의 */
export const liveRatesQuery = (base: string) =>
  queryOptions({
    queryKey: queryKeys.liveRates(base),
    queryFn: () => fetchLiveRates(base),
    staleTime: HALF_DAY,
    retry: 1,
  });

/** 기준 통화의 실시간 환율(참고용). 받기 전 · 실패 · 꺼 두면(enabled false — 외화가 없는 여행) data 가 없다 */
export function useLiveRates(base: string, enabled = true) {
  return useQuery({ ...liveRatesQuery(base), enabled });
}
