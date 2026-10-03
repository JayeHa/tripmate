"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { computeNetBalances, minimizeTransfers, useExpenses } from "@/entities/expense";
import { useTrip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { decimalsOf, formatMoney, MissingRateError } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { AppHeader } from "@/shared/ui/app-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

/** 받을 돈(+) 초록 · 낼 돈(-) 빨강 · 0 은 기본색. Math.sign 의 결과로 고른다 */
const NET_TONE: Record<number, string> = { 1: "text-emerald-600", [-1]: "text-destructive", 0: "" };

export function SettlementView({ tripId }: { tripId: string }) {
  const { data: trip } = useTrip(tripId);
  const { data: members } = useTripMembers(tripId);
  const { data: expenses } = useExpenses(tripId);

  const result = useMemo(() => {
    if (!trip || !members || !expenses) return null;
    try {
      const balances = computeNetBalances(
        expenses,
        members.map((m) => m.user_id),
        trip.home_currency,
        trip.exchange_rates,
      );
      const transfers = minimizeTransfers(balances.net, decimalsOf(trip.home_currency));
      return { balances, transfers, missing: null as string | null };
    } catch (e) {
      if (e instanceof MissingRateError)
        return { balances: null, transfers: [], missing: e.currency };
      throw e;
    }
  }, [trip, members, expenses]);

  const member = (id: string) => members?.find((m) => m.user_id === id);
  const name = (id: string) => member(id)?.profile.display_name ?? "알 수 없음";

  return (
    <>
      <AppHeader title="정산" back={`/trips/${tripId}/expenses`} />
      <main className="flex flex-1 flex-col gap-4 p-4">
        {result?.missing && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">{result.missing} 환율이 없어요</p>
            <p className="mt-1 text-muted-foreground">
              정산하려면{" "}
              <Link href={`/trips/${tripId}/settings`} className="underline">
                설정
              </Link>
              에서 환율을 입력하세요.
            </p>
          </div>
        )}

        {result?.balances && trip && members && (
          <>
            <section className="rounded-xl border bg-card p-4">
              <h2 className="font-semibold">누가 누구에게</h2>
              {result.transfers.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {expenses?.length
                    ? "정산할 금액이 없어요. 딱 맞아요!"
                    : "지출을 기록하면 정산이 계산돼요."}
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-3">
                  {result.transfers.map((t) => (
                    // 그리디 정산은 한 쌍을 한 번만 잇는다(매번 한쪽이 0 이 된다)
                    <li key={`${t.from}-${t.to}`} className="flex items-center gap-2 text-sm">
                      <Person name={name(t.from)} avatarUrl={member(t.from)?.profile.avatar_url} />
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                      <Person name={name(t.to)} avatarUrl={member(t.to)?.profile.avatar_url} />
                      <span className="ml-auto font-semibold">
                        {formatMoney(t.amount, trip.home_currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border bg-card p-4">
              <h2 className="font-semibold">멤버별 정리</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                낸 금액 − 내 몫 = 받을 돈(+) / 낼 돈(−)
              </p>
              <ul className="mt-3 flex flex-col divide-y">
                {members.map((m) => {
                  const net = result.balances.net[m.user_id] ?? 0;
                  const paidBy = result.balances.paidByCurrency[m.user_id] ?? {};
                  return (
                    <li key={m.user_id} className="flex items-center gap-3 py-2.5">
                      <Person
                        name={name(m.user_id)}
                        avatarUrl={member(m.user_id)?.profile.avatar_url}
                      />
                      <div className="ml-auto text-right">
                        <p className={cn("text-sm font-semibold", NET_TONE[Math.sign(net)])}>
                          {net > 0 ? "+" : ""}
                          {formatMoney(net, trip.home_currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          낸 금액{" "}
                          {Object.keys(paidBy).length
                            ? Object.entries(paidBy)
                                .map(([c, v]) => formatMoney(v, c))
                                .join(" + ")
                            : formatMoney(0, trip.home_currency)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-xl border bg-card p-4">
              <h2 className="font-semibold">총 지출</h2>
              <p className="mt-1 text-xl font-bold">
                {formatMoney(result.balances.totalHome, trip.home_currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {Object.entries(result.balances.totalByCurrency)
                  .map(([c, v]) => formatMoney(v, c))
                  .join(" · ")}
                {Object.keys(trip.exchange_rates).length > 0 && (
                  <>
                    {" · 환율 "}
                    {Object.entries(trip.exchange_rates)
                      .map(([c, r]) => `${r.unit} ${c} = ${r.value} ${trip.home_currency}`)
                      .join(", ")}
                  </>
                )}
              </p>
            </section>
          </>
        )}
      </main>
    </>
  );
}

/** 정산 줄의 사람. 렌더 중에 정의하면 매 렌더마다 새 컴포넌트가 되어 아바타가 다시 마운트된다 */
function Person({ name, avatarUrl }: { name: string; avatarUrl: string | null | undefined }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <Avatar size="sm">
        <AvatarImage src={avatarUrl ?? undefined} alt="" />
        <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <span className="truncate">{name}</span>
    </span>
  );
}
