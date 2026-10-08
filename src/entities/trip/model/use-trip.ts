"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import type { ExchangeRates } from "@/shared/lib/money";

import {
  addTripCurrency,
  changeHomeCurrency,
  createTrip,
  deleteTrip,
  fetchTrip,
  fetchTrips,
  rotateInviteToken,
  updateTrip,
  updateTripDates,
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
      void qc.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}

/**
 * 기준 화폐 바꾸기 — 여행 환율 · 지출별 환율 · 송금 기록이 함께 바뀌므로 그 여행 아래 쿼리를 모두 다시 읽는다
 * (지출 · 송금 기록 키는 여행 키 아래에 있다)
 */
export function useChangeHomeCurrency(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      from,
      currency,
      rates,
      factor,
    }: {
      from: string;
      currency: string;
      rates: ExchangeRates;
      factor: number;
    }) => changeHomeCurrency(tripId, from, currency, rates, factor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.trips.all });
      void qc.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) });
    },
  });
}

/** 「다른 통화 추가」 — 끝나면 여행을 다시 읽어 통화 목록 · 환율에 보인다 */
export function useAddTripCurrency(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      home,
      code,
      rate,
    }: {
      home: string;
      code: string;
      rate: { unit: number; value: number };
    }) => addTripCurrency(tripId, home, code, rate),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId), exact: true }),
  });
}

/** 기간 변경은 여행과 그 일정·경로·지출을 함께 바꾼다 */
export function useUpdateTripDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTripDates,
    onSuccess: (_, { tripId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.trips.all });
      void qc.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) });
      void qc.invalidateQueries({ queryKey: queryKeys.scheduleItems(tripId) });
      void qc.invalidateQueries({ queryKey: queryKeys.dayRoutes(tripId) });
      void qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) });
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
