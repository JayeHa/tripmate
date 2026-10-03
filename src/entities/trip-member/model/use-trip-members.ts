"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { fetchMembers, removeMember } from "../api/members";

export function useTripMembers(tripId: string) {
  return useQuery({
    queryKey: queryKeys.trips.members(tripId),
    queryFn: () => fetchMembers(tripId),
  });
}

export function useRemoveMember(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeMember(tripId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trips.members(tripId) }),
  });
}
