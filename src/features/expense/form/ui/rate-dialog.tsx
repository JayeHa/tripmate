"use client";

import { useState } from "react";

import { currencyName } from "@/shared/lib/money";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

import { perUnitLabel, rateDraftOf, rateFromDraft } from "../lib/rate-draft";
import type { ExpenseFormState } from "../model/use-expense-form";

type RateDialogProps = {
  form: Pick<
    ExpenseFormState,
    "rateOpen" | "closeRate" | "currency" | "home" | "rate" | "setRate" | "tripRates"
  >;
};

/**
 * 「환율설정」 — 이 비용에만 쓸 환율. 「100엔 당 [905] 원」, 「기본값으로(920)」 는 여행 환율로 되돌린다.
 * 여행 기본 환율과 같은 값이면 이 비용만의 환율로 남기지 않는다(여행 환율을 고치면 함께 바뀌게).
 * 기준 화폐로 쓴 비용은 바꿀 환율이 없어 「설정불가」. 통화는 금액 칸의 통화 칩에서 바꾼다
 */
export function RateDialog({ form }: RateDialogProps) {
  return (
    <AlertDialog open={form.rateOpen} onOpenChange={(open) => !open && form.closeRate()}>
      <AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-85">
        {form.rateOpen && <RateBody form={form} />}
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** 창 안 — 열 때마다 지금 환율로 칸을 채운다 */
function RateBody({ form }: RateDialogProps) {
  const { currency, home, tripRates } = form;
  const [initial] = useState(() => rateDraftOf(currency, tripRates, form.rate));
  const [draft, setDraft] = useState(initial);
  const locked = currency === home;
  const next = rateFromDraft(draft, currency, tripRates);
  const base = tripRates[currency];
  return (
    <>
      <div className="flex flex-col gap-1.5 px-6 pt-7 pb-5.5">
        <AlertDialogTitle className="text-[21px] font-extrabold text-ink-900">
          환율설정
        </AlertDialogTitle>
        <AlertDialogDescription className="text-sm/normal text-ink-450">
          환율을 변경하면 이 비용에만 적용돼요.
          <br />
          기본값은 설정의 여행 환율이에요.
        </AlertDialogDescription>
        <div className="mt-4.5 flex items-center gap-2.5 rounded-card bg-surface-sunken px-4.5 py-4">
          <div className="flex shrink-0 flex-col gap-0.5">
            <span className="text-[19px] font-extrabold text-ink-900">{currency}</span>
            <span className="text-[13px] text-ink-400">
              {locked ? currencyName(currency) : perUnitLabel(currency, tripRates)}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 items-baseline justify-end gap-1">
            {locked ? (
              <span className="text-[17px] font-bold text-line-dashed">설정불가</span>
            ) : (
              <>
                <input
                  aria-label={`${perUnitLabel(currency, tripRates)} 환율`}
                  inputMode="decimal"
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full min-w-0 bg-transparent text-right text-[19px] font-extrabold text-ink-900 outline-none"
                />
                <span className="text-[17px] font-bold text-ink-900">{currencyName(home)}</span>
              </>
            )}
          </div>
        </div>
        {locked && (
          <p className="pt-2 text-center text-[13px] text-ink-400">
            ⓘ 기준 화폐가 아닌 통화만 환율을 바꿀 수 있어요.
          </p>
        )}
        {!locked && base && (
          <button
            type="button"
            onClick={() => setDraft(String(base.value))}
            className="self-center pt-2 text-[13px] text-ink-450"
          >
            기본값으로 ({base.value.toLocaleString("ko-KR")})
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 border-t border-line-card">
        <button
          type="button"
          onClick={form.closeRate}
          className="h-13 border-r border-line-card text-base text-ink-500"
        >
          취소
        </button>
        <button
          type="button"
          disabled={!locked && next === undefined}
          onClick={() => {
            // 칸을 고치지 않았으면 지금 환율 그대로 — 화면 값에서 거꾸로 계산하면 자릿수가 바뀌어 고친 칸으로 저장된다
            if (!locked && next !== undefined && draft !== initial) form.setRate(next);
            form.closeRate();
          }}
          className="h-13 text-base font-bold text-primary disabled:text-primary-disabled"
        >
          확인
        </button>
      </div>
    </>
  );
}
