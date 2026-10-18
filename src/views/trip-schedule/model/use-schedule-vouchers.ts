"use client";

import { useState } from "react";

import type { TimelineRow } from "@/entities/schedule-item";
import { cardVouchers, useVouchers, type Voucher } from "@/entities/voucher";

/**
 * 일정 화면의 바우처 — 카드마다 바우처(그 카드 · 숙소 카드면 그 숙소), 열린 뷰어 · 수정 창.
 * 카드의 「바우처 N」 칩은 하나면 그 뷰어, 여럿이면 그 카드의 상세(항공편 카드는 항공편 상세)를 연다
 * (2026-10-17 사용자 결정 — 뷰어는 한 바우처의 페이지만 넘긴다)
 */
export function useScheduleVouchers(tripId: string, openCard: (row: TimelineRow) => void) {
  const { data: vouchers = [] } = useVouchers(tripId);
  const [viewerId, setViewerId] = useState<string | null>(null);
  // 고치는 바우처 — 연 때의 것을 쥔다(그사이 지워져도 새 바우처로 바뀌지 않게)
  const [editing, setEditing] = useState<{ voucher: Voucher } | null>(null);
  return {
    /** 카드의 「바우처 N」 칩 */
    voucherOf: (row: TimelineRow) => {
      const list = cardVouchers(vouchers, row.item);
      return {
        count: list.length,
        onOpen: () => (list.length === 1 ? setViewerId(list[0].id) : openCard(row)),
      };
    },
    /** 이 카드의 바우처(넣은 순서) — 숙소 · 항공편 카드면 그 숙소 · 항공편 것까지 */
    ofCard: (card: { id: string; stay_id: string | null; flight_id?: string | null }) =>
      cardVouchers(vouchers, card),
    /** 이 숙소의 바우처(숙소 상세) */
    ofStay: (stayId: string) => vouchers.filter((v) => v.stay_id === stayId),
    viewerId,
    openViewer: (voucher: Voucher) => setViewerId(voucher.id),
    closeViewer: () => setViewerId(null),
    editing: editing?.voucher ?? null,
    formOpen: editing !== null,
    openEdit: (voucher: Voucher) => setEditing({ voucher }),
    closeEdit: () => setEditing(null),
  };
}

export type ScheduleVouchers = ReturnType<typeof useScheduleVouchers>;
