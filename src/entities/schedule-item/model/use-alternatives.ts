"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { addAlternative, fetchAlternatives, swapAlternative } from "../api/alternatives";
import type { ScheduleItem } from "./types";

/** 여행의 대체 장소 줄 — buildTimeline 이 붙은 일정마다 모은다 */
export function useAlternatives(tripId: string) {
  return useQuery({
    queryKey: queryKeys.alternatives(tripId),
    queryFn: () => fetchAlternatives(tripId),
  });
}

/**
 * 일정 · 대체 장소 · 경로 · 이동 기록을 다시 읽는다. 끝날 때까지 기다리는 Promise 를 돌려준다 —
 * onSuccess 에서 돌려주면 mutateAsync 가 새 목록을 받은 뒤에 끝나서, 부른 쪽이 바뀐 줄을 바로 찾을 수 있다
 */
function useRefetchItems(tripId: string) {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      // 일정 키 아래에 대체 장소 키가 있어 함께 다시 읽는다
      qc.invalidateQueries({ queryKey: queryKeys.scheduleItems(tripId) }),
      qc.invalidateQueries({ queryKey: queryKeys.dayRoutes(tripId) }),
      // 바꾸기는 앞뒤 이동 기록을 새로 그 자리에 들어온 줄로 옮긴다 — 옛 기록으로 이동 창을 열면 덮어쓴다
      qc.invalidateQueries({ queryKey: queryKeys.moves(tripId) }),
      // 바꾸기는 지출의 합계 포함 여부도 바꾼다(0033) — 실시간을 기다리지 않고 가계부를 맞춘다
      qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) }),
    ]);
}

/** 저장한 장소를 일정의 대체 장소로 붙인다 */
export function useAddAlternative(tripId: string) {
  const refetch = useRefetchItems(tripId);
  return useMutation({
    mutationFn: ({ main, placeId }: { main: ScheduleItem; placeId: string }) =>
      addAlternative(main, placeId),
    onSuccess: refetch,
  });
}

/** 「바꾸기」. 끝나면 새 목록까지 받은 뒤라 부른 쪽이 새로 들어온 줄(altId)로 상세를 옮길 수 있다 */
export function useSwapAlternative(tripId: string) {
  const refetch = useRefetchItems(tripId);
  return useMutation({ mutationFn: swapAlternative, onSuccess: refetch });
}
