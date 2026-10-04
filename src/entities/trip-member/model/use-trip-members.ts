"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { fetchMembers, removeMember } from "../api/members";

/** 여행 멤버 목록. enabled=false 면 요청하지 않는다(닫혀 있는 초대 창처럼 아직 안 보이는 곳) */
export function useTripMembers(tripId: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.trips.members(tripId),
    queryFn: () => fetchMembers(tripId),
    enabled,
  });
}

export function useRemoveMember(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeMember(tripId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trips.members(tripId) }),
  });
}
