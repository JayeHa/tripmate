"use client";

import { AppHeader } from "@/shared/ui/app-header";

import type { ExpenseList } from "../../model/use-expense-list";
import { ListTabs } from "../mobile/list-tabs";
import { RefundList } from "./refund-list";

type MobileRefundsProps = { tripId: string; list: ExpenseList };

/** 모바일 가계부 「환급」 탭 — 머리 · 탭(내역 | 지출 · 정산 | 환급) · 택스 리펀 목록 */
export function MobileRefunds({ tripId, list }: MobileRefundsProps) {
  const base = `/trips/${tripId}/expenses`;
  return (
    <>
      <AppHeader title="가계부" subtitle={list.trip.title} back="/trips" />
      <ListTabs
        active="refund"
        listHref={base}
        statsHref={`${base}/stats`}
        refundHref={`${base}/refunds`}
      />
      <main className="flex flex-col pb-24">
        <RefundList tripId={tripId} trip={list.trip} onToast={list.showToast} />
      </main>
    </>
  );
}
