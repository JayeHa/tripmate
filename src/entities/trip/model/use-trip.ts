"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import {
  createTrip,
  deleteTrip,
  fetchTrip,
  fetchTrips,
  rotateInviteToken,
  updateTrip,
} from "../api/trips";
import type { TripFormValues } from "./schema";

export function useTrips({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: queryKeys.trips.all, queryFn: fetchTrips, enabled });
}

export function useTrip(tripId: string) {
  return useQuery({ queryKey: queryKeys.trips.detail(tripId), queryFn: () => fetchTrip(tripId) });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTrip,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trips.all }),
  });
}

export function useUpdateTrip(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: TripFormValues) => updateTrip(tripId, values),
    onSuccess: (trip) => {
      qc.setQueryData(queryKeys.trips.detail(tripId), trip);
      qc.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trips.all }),
  });
}

export function useRotateInviteToken(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => rotateInviteToken(tripId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) }),
  });
}
