"use client";

import { Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import {
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategory,
  type ExpenseWithSplits,
  useExpenses,
} from "@/entities/expense";
import { useTrip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { dateToDayIndex, dayLabel } from "@/shared/lib/days";
import { type ExchangeRates, formatMoney, MissingRateError, toHome } from "@/shared/lib/money";
import { AppHeader } from "@/shared/ui/app-header";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";

/** 기준 화폐로 환산. 환율이 없으면 null(합계에 「환율 없음」 표시) */
function toHomeOrNull(
  amount: number,
  currency: string,
  trip: { home_currency: string; exchange_rates: ExchangeRates },
) {
  try {
    return toHome(amount, currency, trip.home_currency, trip.exchange_rates);
  } catch (err) {
    if (err instanceof MissingRateError) return null;
    throw err;
  }
}

type ExpenseListViewProps = { tripId: string };

export function ExpenseListView({ tripId }: ExpenseListViewProps) {
  const { data: trip } = useTrip(tripId);
  const { data: members } = useTripMembers(tripId);
  const { data: expenses, isPending } = useExpenses(tripId);

  const nameOf = (id: string) =>
    members?.find((m) => m.user_id === id)?.profile.display_name ?? "알 수 없음";

  const groups = useMemo(() => {
    const map = new Map<string, ExpenseWithSplits[]>();
    for (const e of expenses ?? []) {
      const list = map.get(e.spent_on) ?? [];
      list.push(e);
      map.set(e.spent_on, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [expenses]);

  const totals = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    let home = 0;
    let missing = false;
    for (const e of expenses ?? []) {
      byCurrency[e.currency] = (byCurrency[e.currency] ?? 0) + Number(e.amount);
      if (!trip) continue;
      const converted = toHomeOrNull(Number(e.amount), e.currency, trip);
      if (converted === null) missing = true;
      else home += converted;
    }
    return { byCurrency, home, missing };
  }, [expenses, trip]);

  return (
    <>
      <AppHeader title="가계부" back="/trips" />
      <main className="flex flex-1 flex-col gap-4 p-4 pb-28">
        {trip && expenses && expenses.length > 0 && (
          <section className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">총 지출</p>
            <p className="mt-1 text-2xl font-bold">
              {formatMoney(totals.home, trip.home_currency)}
            </p>
            {totals.missing && (
              <p className="mt-1 text-xs text-destructive">
                환율이 없는 화폐가 있어요. 설정에서 환율을 추가하세요.
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {Object.entries(totals.byCurrency)
                .map(([c, v]) => formatMoney(v, c))
                .join(" · ")}
            </p>
          </section>
        )}

        {isPending && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        )}

        {expenses && expenses.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="아직 지출이 없어요"
            description="첫 지출을 기록해보세요."
            className="flex-1 justify-center"
          />
        )}

        {trip &&
          groups.map(([date, list]) => {
            const dayIndex = dateToDayIndex(trip.start_date, trip.end_date, date);
            const dayTotal: Record<string, number> = {};
            for (const e of list)
              dayTotal[e.currency] = (dayTotal[e.currency] ?? 0) + Number(e.amount);
            return (
              <section key={date} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-semibold">
                    Day {dayIndex + 1}{" "}
                    <span className="font-normal text-muted-foreground">
                      {dayLabel(trip.start_date, dayIndex)}
                    </span>
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {Object.entries(dayTotal)
                      .map(([c, v]) => formatMoney(v, c))
                      .join(" · ")}
                  </span>
                </div>
                <ul className="flex flex-col divide-y rounded-xl border bg-card">
                  {list.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/trips/${tripId}/expenses/${e.id}`}
                        className="flex items-center gap-3 p-3 active:bg-accent"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px]">
                          {EXPENSE_CATEGORY_LABEL[e.category as ExpenseCategory]?.slice(0, 2) ??
                            "기타"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {e.memo || EXPENSE_CATEGORY_LABEL[e.category as ExpenseCategory]}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {nameOf(e.payer_id)} 결제 · {e.splits.length}명
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold">
                          {formatMoney(Number(e.amount), e.currency)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
      </main>

      <div className="fixed inset-x-0 bottom-16 z-20 flex justify-center p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:bottom-0">
        <Button
          size="lg"
          className="shadow-lg"
          nativeButton={false}
          render={<Link href={`/trips/${tripId}/expenses/new`} />}
        >
          <Plus /> 지출 추가
        </Button>
      </div>
    </>
  );
}
