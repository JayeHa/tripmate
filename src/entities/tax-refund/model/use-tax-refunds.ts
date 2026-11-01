"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import {
  addTaxRefund,
  deleteTaxRefund,
  fetchTaxRefunds,
  updateTaxRefund,
} from "../api/tax-refunds";
import type { RefundSteps, TaxRefund, TaxRefundFields } from "./types";

/** 택스 리펀의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const taxRefundsQuery = (tripId: string) =>
  queryOptions({
    queryKey: queryKeys.taxRefunds(tripId),
    queryFn: () => fetchTaxRefunds(tripId),
  });

/** 여행의 택스 리펀 */
export function useTaxRefunds(tripId: string) {
  return useQuery(taxRefundsQuery(tripId));
}

/** 저장할 것 — id 가 null 이면 새로 넣고, 아니면 그 건을 고친다 */
export type TaxRefundSave = { id: string | null; fields: TaxRefundFields };

/** 한 건 저장 — 창이 저장을 기다렸다 닫으므로 화면 먼저 바꾸지 않고, 끝나면 다시 읽는다 */
export function useSaveTaxRefund(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: TaxRefundSave) =>
      v.id ? updateTaxRefund(v.id, v.fields) : addTaxRefund(tripId, v.fields),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.taxRefunds(tripId) }),
  });
}

/** 한 건 지우기 */
export function useDeleteTaxRefund(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTaxRefund,
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.taxRefunds(tripId) }),
  });
}

/**
 * 단계 바꾸기(세관 확인 · 받았어요 · 되돌리기) — 공항에서 누르는 버튼이라 화면을 먼저 바꾸고 올린다.
 * 실패하면 되돌리고, 끝나면 다시 읽는다
 */
export function useSetRefundSteps(tripId: string) {
  const qc = useQueryClient();
  const key = queryKeys.taxRefunds(tripId);
  return useMutation({
    mutationFn: (v: { id: string; steps: RefundSteps }) => updateTaxRefund(v.id, v.steps),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key });
      const before = qc.getQueryData<TaxRefund[]>(key);
      qc.setQueryData<TaxRefund[]>(key, (list) =>
        list?.map((r) => (r.id === v.id ? { ...r, ...v.steps } : r)),
      );
      return { before };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.before) qc.setQueryData(key, ctx.before);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
