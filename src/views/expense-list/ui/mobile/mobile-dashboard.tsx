"use client";

import { useRouter } from "next/navigation";

import { type PersonKey, SettleBand } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { NAV } from "@/shared/lib/nav-transition";
import { sizeByLength } from "@/shared/lib/size-by-length";
import { cn } from "@/shared/lib/utils";
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
 * 모바일 가계부 「지출 · 정산」 — 총 지출(+ 내가 쓴 돈) · 정산 띠 → 카테고리 → 정산(사람 3줄까지 · 내 송금).
 * 혼자 쓰는 가계부는 내가 쓴 돈 · 정산 띠 · 정산 칸이 없다. 카테고리 줄 · 「전체 보기」 는 카테고리 상세로,
 * 정산 띠 · 「자세히 보기」 는 정산 화면으로 간다
 */
/** 총 지출 글자 크기 — 「₩1,234,567,890」(14자)까지 28, 더 길면 20 */
const TOTAL_SIZES = [[14, "text-[28px]"]] as const;

export function MobileDashboard({ tripId, list }: MobileDashboardProps) {
  const router = useRouter();
  const { trip } = list;
  const base = `/trips/${tripId}/expenses`;
  /** 정산 화면 — 사람을 주면 그 사람부터 */
  const openSettle = (person: PersonKey | null) =>
    router.push(`${base}/settlement${person ? `?p=${encodeURIComponent(person)}` : ""}`, {
      transitionTypes: NAV.forward,
    });
  const dash = useDashboard(tripId, list);
  const home = trip.home_currency;
  return (
    <>
      <AppHeader title="가계부" subtitle={trip.title} back="/trips" />
      <ListTabs active="stats" listHref={base} statsHref={`${base}/stats`} />
      <main className="flex flex-col pb-10">
        <div className="flex flex-col gap-3 px-5 pt-5.5 pb-4.5">
          {/* 금액이 길면 글자를 줄이고, 그래도 넘치면 「내가 쓴 돈」 이 아래 줄로 내려간다(겹치지 않게) */}
          <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1.5">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[13px] font-bold text-ink-400">
                {list.solo ? "총 지출" : `총 지출 · ${list.everyone}명`}
              </span>
              <span
                className={cn(
                  "font-extrabold tracking-[-0.02em] whitespace-nowrap text-ink-900",
                  sizeByLength(formatMoney(list.total.home, home), TOTAL_SIZES, "text-xl"),
                )}
              >
                {formatMoney(list.total.home, home)}
              </span>
            </div>
            {!list.solo && list.mySpent !== null && (
              <div className="ml-auto flex flex-col items-end gap-0.5">
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
              onClick={() => openSettle(null)}
            />
          )}
        </div>
        <section className={SECTION}>
          <CategoryCard
            shares={dash.categories}
            home={home}
            onOpen={(pick) =>
              router.push(`${base}/categories?c=${pick}`, { transitionTypes: NAV.forward })
            }
          />
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
              onOpen={openSettle}
            />
          </section>
        )}
      </main>
    </>
  );
}
