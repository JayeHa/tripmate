"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { addTripGuest, fetchTripGuests, removeTripGuest, renameTripGuest } from "../api/guests";

export function useTripGuests(tripId: string) {
  return useQuery({
    queryKey: queryKeys.tripGuests(tripId),
    queryFn: () => fetchTripGuests(tripId),
  });
}

/**
 * 정산 인원 넣기 · 이름 바꾸기 · 빼기 — 끝나면 목록을 다시 읽는다.
 * 이름 바꾸기는 실패해도 다시 읽는다 — 그사이 빠진 인원(GUEST_GONE)이 실시간보다 먼저 목록에서 사라지게
 */
export function useTripGuestActions(tripId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.tripGuests(tripId) });
  return {
    add: useMutation({
      mutationFn: (name: string) => addTripGuest(tripId, name),
      onSuccess: invalidate,
    }),
    rename: useMutation({
      mutationFn: ({ guestId, name }: { guestId: string; name: string }) =>
        renameTripGuest(guestId, name),
      onSettled: invalidate,
    }),
    remove: useMutation({ mutationFn: removeTripGuest, onSuccess: invalidate }),
  };
}
