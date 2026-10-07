"use client";

import { useRouter } from "next/navigation";

import { SettleBand } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { AppHeader } from "@/shared/ui/app-header";

import { useDashboard } from "../../model/use-dashboard";
import type { ExpenseList } from "../../model/use-expense-list";
import { CategoryCard } from "../dashboard/category-card";
import { SettleCard } from "../dashboard/settle-card";
import { SettleLoadError } from "../dashboard/settle-load-error";
import { ListTabs } from "./list-tabs";

type MobileDashboardProps = { tripId: string; list: ExpenseList };

/** 대시보드의 칸 — 위에 8px 회색 띠로 나눈다 */
const SECTION = "flex flex-col gap-3 border-t-8 border-surface-sunken px-5 py-4.5";

/**
 * 모바일 가계부 「지출 · 정산」 — 총 지출(+ 내가 쓴 돈) · 정산 띠 → 카테고리 → 정산(사람별 · 남은 송금).
 * 혼자 쓰는 가계부는 내가 쓴 돈 · 정산 띠 · 정산 칸이 없다. 정산 띠 · 「자세히 보기」 는 정산 화면으로 간다
 */
export function MobileDashboard({ tripId, list }: MobileDashboardProps) {
  const router = useRouter();
  const { trip } = list;
  const base = `/trips/${tripId}/expenses`;
  const settleHref = `${base}/settlement`;
  const dash = useDashboard(tripId, list);
  const home = trip.home_currency;
  return (
    <>
      <AppHeader title="가계부" subtitle={trip.title} back="/trips" />
      <ListTabs active="stats" listHref={base} statsHref={`${base}/stats`} />
      <main className="flex flex-col pb-10">
        <div className="flex flex-col gap-3 px-5 pt-5.5 pb-4.5">
          <div className="flex items-end gap-2.5">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[13px] font-bold text-ink-400">
                {list.solo ? "총 지출" : `총 지출 · ${list.everyone}명`}
              </span>
              <span className="text-[28px] font-extrabold tracking-[-0.02em] text-ink-900">
                {formatMoney(list.total.home, home)}
              </span>
            </div>
            {!list.solo && list.mySpent !== null && (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-xs text-ink-450">내가 쓴 돈</span>
                <span className="text-[15px] font-extrabold text-ink-900">
                  {formatMoney(list.mySpent, home)}
                </span>
              </div>
            )}
          </div>
          {!list.solo && dash.settle?.band && (
            <SettleBand
              state={dash.settle.band}
              home={home}
              personOf={dash.bandPersonOf}
              onClick={() => router.push(settleHref)}
            />
          )}
        </div>
        <section className={SECTION}>
          <CategoryCard shares={dash.categories} home={home} />
        </section>
        {!list.solo && dash.settleFailed && (
          <section className={SECTION}>
            <SettleLoadError onRetry={dash.retrySettle} />
          </section>
        )}
        {!list.solo && dash.settle && (
          <section className={SECTION}>
            <SettleCard
              settle={dash.settle}
              home={home}
              avatarOf={dash.avatarOf}
              detailHref={settleHref}
            />
          </section>
        )}
      </main>
    </>
  );
}
