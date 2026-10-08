"use client";

import { useState } from "react";

import { useExpenses, useSettlements } from "@/entities/expense";
import { type Trip, type TripFormValues, useChangeHomeCurrency } from "@/entities/trip";
import { appliedFactor, currencyName, rebaseFactor, rebaseRates } from "@/shared/lib/money";
import { useHeldWhileClosing, useOpenCount } from "@/shared/lib/use-dialog-state";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

type HomeCurrencyDialogProps = {
  trip: Trip;
  /** 저장하려는 여행 정보(기준 화폐가 바뀐 것). null 이면 닫힘 */
  values: TripFormValues | null;
  onCancel: () => void;
  /** 바꾼 뒤 — 나머지 칸(제목 · 기간)을 새 환율과 함께 저장한다 */
  onChanged: (values: TripFormValues, rates: Trip["exchange_rates"]) => void;
};

/**
 * 기준 화폐를 바꾸기 전 확인 — 「원 → 엔으로 바꿔요」, 새 기준으로 다시 계산한 여행 환율과
 * 「지출 N건 · 송금 기록 M건을 엔 기준으로 다시 계산해요」. 옛 환율에 새 기준 화폐가 없으면
 * 「1달러 = [ ] 원」 을 물어 그 값으로 계산한다(넣어야 바꿀 수 있다). 폼에서 고친 환율 줄 대신 다시 계산한 환율이 저장된다
 */
export function HomeCurrencyDialog({ trip, values, onCancel, onChanged }: HomeCurrencyDialogProps) {
  // 요청을 창 바깥에 둔다 — 바꾸는 동안 Esc · 바깥 누르기로 닫히면 본문이 사라져,
  // 기준 화폐는 바뀌었는데 같은 저장의 제목 · 기간이 저장되지 않는다(사라진 쪽의 onSuccess 는 불리지 않는다)
  const change = useChangeHomeCurrency(trip.id);
  // 닫히는 동안에도 본문을 그리고, 열 때마다 새로 그린다(지난번에 적은 환율이 남지 않게)
  const shown = useHeldWhileClosing(values !== null, values);
  const opens = useOpenCount(values !== null);
  return (
    <AlertDialog
      open={values !== null}
      locked={change.isPending}
      onOpenChange={(open) => !open && onCancel()}
    >
      <AlertDialogContent>
        {shown && (
          <Body
            key={opens}
            trip={trip}
            values={shown}
            change={change}
            onCancel={onCancel}
            onChanged={onChanged}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

type BodyProps = Omit<HomeCurrencyDialogProps, "values"> & {
  values: TripFormValues;
  change: ReturnType<typeof useChangeHomeCurrency>;
};

/** 창 안 — 계산한 환율 미리 보기 · 모르는 환율 묻기 · 바꾸기 */
function Body({ trip, values, change, onCancel, onChanged }: BodyProps) {
  const { data: expenses = [] } = useExpenses(trip.id);
  const { data: settlements = [] } = useSettlements(trip.id);
  const from = trip.home_currency;
  const to = values.home_currency;
  const known = rebaseFactor(trip.exchange_rates, to);
  const [asked, setAsked] = useState("");
  const typed = Number(asked.replace(/,/g, ""));
  const factor = known ?? (typed > 0 ? typed : null);
  const rates = factor === null ? null : rebaseRates(trip.exchange_rates, from, to, factor);
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>
          기준 화폐를 {currencyName(from)} → {currencyName(to)}(으)로 바꿀까요?
        </AlertDialogTitle>
        <AlertDialogDescription>
          지출 {expenses.length}건 · 송금 기록 {settlements.length}건을 {to} 기준으로 다시 계산해요.
          여행 환율은 아래 값으로 바뀌고, 설정에서 다시 고칠 수 있어요.
        </AlertDialogDescription>
      </AlertDialogHeader>
      {known === null && (
        <label className="flex items-center gap-2 rounded-memo bg-surface-sunken px-3 py-2.5 text-sm">
          <span className="shrink-0 font-bold text-ink-900">1 {to} =</span>
          <input
            inputMode="decimal"
            autoFocus
            value={asked}
            onChange={(e) => setAsked(e.target.value)}
            placeholder="환율"
            className="min-w-0 flex-1 bg-transparent text-right font-bold text-ink-900 outline-none"
          />
          <span className="shrink-0 text-ink-500">{from}</span>
        </label>
      )}
      {rates && (
        <ul className="flex flex-col gap-1 rounded-memo bg-surface-sunken px-3 py-2.5 text-[13px]">
          {Object.entries(rates).map(([code, r]) => (
            <li key={code} className="flex justify-between text-ink-700">
              <span>
                {r.unit.toLocaleString("ko-KR")} {code}
              </span>
              <span className="font-bold text-ink-900">
                {r.value.toLocaleString("ko-KR", { maximumFractionDigits: 6 })} {to}
              </span>
            </li>
          ))}
        </ul>
      )}
      {change.isError && (
        <p role="alert" className="text-[13px] text-destructive">
          {changeErrorText(change.error)}
        </p>
      )}
      <AlertDialogFooter>
        <Button
          variant="chip"
          size="form"
          className="flex-1"
          onClick={onCancel}
          disabled={change.isPending}
        >
          취소
        </Button>
        <Button
          size="form"
          className="flex-1"
          disabled={!rates || factor === null || change.isPending}
          onClick={() => {
            if (!rates || factor === null) return;
            change.mutate(
              // 저장할 옛 기준 줄에서 거꾸로 구한 값 — 원화 지출(여행 환율)과 송금 기록이 같은 값으로 바뀌게
              { from, currency: to, rates, factor: appliedFactor(rates, from) },
              { onSuccess: () => onChanged(values, rates) },
            );
          }}
        >
          {change.isPending ? "바꾸는 중..." : "바꾸기"}
        </Button>
      </AlertDialogFooter>
    </>
  );
}

/** 바꾸지 못한 이유 — 다른 멤버가 먼저 기준 화폐를 바꿨으면 새로 불러와 다시 하라고, 그 밖은 다시 시도 */
function changeErrorText(error: Error | null): string {
  if (error?.message.includes("changed by someone else")) {
    return "다른 사람이 기준 화폐를 먼저 바꿨어요. 화면을 새로 불러온 뒤 다시 해 주세요.";
  }
  return "기준 화폐를 바꾸지 못했어요. 다시 시도해 주세요.";
}
