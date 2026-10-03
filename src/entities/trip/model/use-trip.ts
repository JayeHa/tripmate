"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import {
  createTrip,
  deleteTrip,
  fetchTrip,
  fetchTrips,
  rotateInviteToken,
  updateTrip,
} from "@/lib/queries/trips";
import type { TripFormValues } from "@/lib/schemas/trip";

export function useTrips() {
  return useQuery({ queryKey: queryKeys.trips.all, queryFn: fetchTrips });
}

export function useTrip(tripId: string) {
  return useQuery({ queryKey: queryKeys.trips.detail(tripId), queryFn: () => fetchTrip(tripId) });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ values, ownerId }: { values: TripFormValues; ownerId: string }) =>
      createTrip(values, ownerId),
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
