"use client";

import { queryOptions, useQueries } from "@tanstack/react-query";

import type { CountryHoliday } from "@/shared/lib/country-holidays";

import { queryKeys } from "./query-keys";

/** 배포 사이에는 바뀌지 않는 데이터라 하루 동안 다시 받지 않는다 */
const DAY = 24 * 60 * 60 * 1000;

/** 그 나라 그 해의 공휴일을 서버 라우트에서 받는다. 실패하면 던진다(화면은 공휴일을 빼고 그린다) */
async function fetchHolidays(country: string, year: number): Promise<CountryHoliday[]> {
  const res = await fetch(`/api/holidays?country=${country}&year=${year}`);
  if (!res.ok) throw new Error(`holidays ${res.status}`);
  return (await res.json()) as CountryHoliday[];
}

/** 나라 · 해 하나의 공휴일 조회 정의 — 기기에 남겨 오프라인에서도 보인다 */
export const holidaysQuery = (country: string, year: number) =>
  queryOptions({
    queryKey: queryKeys.holidays(country, year),
    queryFn: () => fetchHolidays(country, year),
    staleTime: DAY,
    retry: 1,
  });

/** from ~ to 에 걸친 해들(보통 하나, 연말 여행이면 둘) */
function yearsBetween(from: string, to: string): number[] {
  const first = Number(from.slice(0, 4));
  const last = Number(to.slice(0, 4));
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

/**
 * 여행지 국가의 from ~ to(yyyy-MM-dd, 둘 다 포함) 공휴일, 날짜순. 나라를 아직 모르거나(null) 받는 중 · 실패하면 undefined.
 * 데이터가 없는 나라는 빈 목록이다
 */
export function useCountryHolidays(
  country: string | null,
  from: string,
  to: string,
): CountryHoliday[] | undefined {
  return useQueries({
    queries: yearsBetween(from, to).map((year) => ({
      ...holidaysQuery(country ?? "", year),
      enabled: !!country,
    })),
    combine: (results) =>
      results.every((r) => r.data)
        ? results.flatMap((r) => r.data ?? []).filter((h) => h.date >= from && h.date <= to)
        : undefined,
  });
}
