"use client";

import { useState } from "react";

import { startRefundCurrency, type TaxRefund, useTaxRefunds } from "@/entities/tax-refund";
import type { Trip } from "@/entities/trip";
import { type RefundFormTarget, useRefundMembers } from "@/features/expense/refund";
import { tripCurrencies } from "@/shared/lib/money";

/**
 * 「환급」 화면(모바일 탭 · PC 창)의 상태 — 택스 리펀 목록(사람 칩으로 거른 것, 고른 사람은 이 화면에서만 기억) · 일행(혼자면 null) · 여행 통화 · 열린 상세(id 로 찾아 그린다 — 단계를 바꾸면 바로 따라오고,
 * 그사이 지워지면 닫힌다) · 추가 · 수정 폼. 상세의 「수정」 은 상세를 닫고 폼을 연다
 */
export function useRefundScreen(tripId: string, trip: Trip) {
  const query = useTaxRefunds(tripId);
  const all = query.data ?? [];
  const { members } = useRefundMembers(tripId);
  const [owner, setOwner] = useState<string | null>(null);
  // 고른 사람이 여행에서 나갔으면 전체로
  const picked = members?.some((m) => m.id === owner) ? owner : null;
  const refunds = picked ? all.filter((r) => r.owner_id === picked) : all;
  const currencies = tripCurrencies(trip.home_currency, trip.exchange_rates);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<RefundFormTarget | null>(null);
  return {
    refunds,
    /** 거르기 전 — 비었는지 · 새 건 통화는 전체로 본다 */
    all,
    members,
    owner: picked,
    setOwner,
    isPending: query.isPending,
    /** 한 번도 읽지 못했다 — 안내와 「다시 시도」 */
    failed: query.isError && query.data === undefined,
    retry: () => void query.refetch(),
    currencies,
    startCurrency: startRefundCurrency(currencies, all),
    detail: refunds.find((r) => r.id === detailId) ?? null,
    openDetail: (refund: TaxRefund) => setDetailId(refund.id),
    closeDetail: () => setDetailId(null),
    form,
    openNew: () => setForm({ refund: null }),
    openEdit: (refund: TaxRefund) => {
      setDetailId(null);
      setForm({ refund });
    },
    closeForm: () => setForm(null),
  };
}

export type RefundScreen = ReturnType<typeof useRefundScreen>;
