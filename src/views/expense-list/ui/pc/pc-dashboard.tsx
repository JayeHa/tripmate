"use client";

import { type PersonKey, SettleBand } from "@/entities/expense";

import type { CategoryPick } from "../../lib/category-detail";
import type { Dashboard } from "../../model/use-dashboard";
import type { ExpenseList } from "../../model/use-expense-list";
import { CategoryCard } from "../dashboard/category-card";
import { SettleCard } from "../dashboard/settle-card";
import { SettleLoadError } from "../dashboard/settle-load-error";
import { SummaryCard } from "../mobile/summary-card";
import { RefundCard } from "../refund/refund-card";

type PcDashboardProps = {
  list: ExpenseList;
  dash: Dashboard;
  /** 카테고리 상세 창을 연다 */
  onCategory: (pick: CategoryPick) => void;
  /** 정산 창을 연다(null 이면 나부터) */
  onSettle: (person: PersonKey | null) => void;
  /** 환급 창을 연다 */
  onRefund: () => void;
};

/** 오른쪽 카드 하나 — 흰 바탕 · 테두리 · r16 */
const CARD = "flex shrink-0 flex-col gap-3 rounded-[16px] border border-divider px-4.5 py-4";

/**
 * PC 가계부 오른쪽(줄을 고르지 않았을 때) — 요약(총 지출 · 내가 결제한 돈 + 정산 띠) → 카테고리 → 정산 → 환급.
 * 모바일 「지출 · 정산」 탭과 같은 카드를 작은 크기로 그린다. 혼자 쓰는 가계부는 정산 띠 · 정산 카드가 없다.
 * 카테고리 줄 · 「전체 보기」 는 카테고리 상세 창을, 정산 띠 · 「자세히 보기」 · 사람 줄은 정산 창을, 환급 카드는 환급 창을 연다(창은 목록이 쥔다)
 */
export function PcDashboard({ list, dash, onCategory, onSettle, onRefund }: PcDashboardProps) {
  const { trip } = list;
  const home = trip.home_currency;
  return (
    <>
      <div className="shrink-0 overflow-hidden rounded-[16px] border border-divider">
        <SummaryCard
          total={list.total}
          home={home}
          rates={trip.exchange_rates}
          people={list.solo ? null : list.everyone}
          myPaid={list.myPaid}
        >
          {!list.solo && dash.settle?.band && (
            <SettleBand
              state={dash.settle.band}
              home={home}
              personOf={dash.bandPersonOf}
              onClick={() => onSettle(null)}
              size="sm"
            />
          )}
        </SummaryCard>
      </div>
      <section className={CARD}>
        <CategoryCard shares={dash.categories} home={home} size="sm" onOpen={onCategory} />
      </section>
      {!list.solo && dash.settleFailed && (
        <section className={CARD}>
          <SettleLoadError onRetry={dash.retrySettle} />
        </section>
      )}
      {!list.solo && dash.settle && (
        <section className={CARD}>
          <SettleCard
            settle={dash.settle}
            home={home}
            avatarOf={dash.avatarOf}
            onOpen={onSettle}
            size="sm"
          />
        </section>
      )}
      <section className={CARD}>
        <RefundCard tripId={trip.id} size="sm" onOpen={onRefund} />
      </section>
    </>
  );
}
