"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { fetchMembers, removeMember } from "@/lib/queries/members";

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
