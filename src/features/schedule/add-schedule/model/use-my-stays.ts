"use client";

import { useStays } from "@/entities/stay";
import { dayIndexToDate } from "@/shared/lib/days";

import { myStayRows, stayGoogleIds } from "../lib/my-stays";

/**
 * 일정 추가의 「내 숙소」 — 담을 날(dayIndex)에 묵는 숙소가 먼저 오는 줄들과, 추천 결과에서 뺄 숙소 장소의 구글 id.
 * 숙소를 아직 못 읽었으면 빈 목록
 */
export function useMyStays(
  tripId: string,
  startDate: string,
  dayIndex: number,
  items: Parameters<typeof myStayRows>[1],
  query: string,
) {
  const { data: stays = [] } = useStays(tripId);
  return {
    rows: myStayRows(stays, items, dayIndexToDate(startDate, dayIndex), dayIndex, query),
    googleIds: stayGoogleIds(stays),
  };
}
