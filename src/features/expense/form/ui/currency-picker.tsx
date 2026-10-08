"use client";

import { ArrowLeft, Search, X } from "lucide-react";
import { useState } from "react";

import { useAddTripCurrency } from "@/entities/trip";
import { defaultRate, searchCurrencies } from "@/shared/lib/money";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

type CurrencyPickerProps = {
  open: boolean;
  onClose: () => void;
  tripId: string;
  home: string;
  /** 이 여행이 이미 쓰는 통화(기준 화폐 포함) — 「추가됨」 */
  have: string[];
  /** 더한 뒤(또는 이미 있던 통화를 고른 뒤) 그 통화로 */
  onPicked: (code: string) => void;
};

/**
 * 「다른 통화 추가」 — 모바일은 전체 화면, PC 는 가운데 420×520. 나라 · 통화 이름 · 코드로 찾고 「추가」 하면
 * 여행 환율에 그 통화를 처음 환율(고정 값을 이 여행의 기준 화폐로 바꾼 값)로 더하고 그 통화를 고른다.
 * 처음 환율은 대략 값이라 위에 알린다 — 금액 아래 환율 줄(✎)이나 설정에서 고친다
 */
export function CurrencyPicker({
  open,
  onClose,
  tripId,
  home,
  have,
  onPicked,
}: CurrencyPickerProps) {
  const [query, setQuery] = useState("");
  const add = useAddTripCurrency(tripId);
  const list = searchCurrencies(query);
  /** 더하고 고른다. 이미 있으면 고르기만 */
  function pick(code: string) {
    if (have.includes(code)) {
      onPicked(code);
      return;
    }
    const rate = defaultRate(code, home);
    if (!rate) return;
    add.mutate({ home, code, rate }, { onSuccess: () => onPicked(code) });
  }
  return (
    <Dialog open={open} locked={add.isPending} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none p-0 sm:max-w-none lg:h-130 lg:w-105 lg:rounded-sheet"
      >
        <DialogTitle className="sr-only">다른 통화 추가</DialogTitle>
        <div className="flex h-14 shrink-0 items-center gap-3 px-4.5">
          <button type="button" aria-label="닫기" onClick={onClose} className="flex text-ink-900">
            <ArrowLeft className="size-6.5 lg:hidden" />
            <X className="hidden size-6 lg:block" />
          </button>
          <Search aria-hidden="true" className="size-4.5 shrink-0 text-ink-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="국가명 또는 통화를 검색하세요."
            className="min-w-0 flex-1 bg-transparent text-[17px] text-ink-900 outline-none placeholder:text-ink-350"
          />
          {query && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => setQuery("")}
              className="flex size-5.5 items-center justify-center rounded-full bg-line-strong"
            >
              <X className="size-3.25 text-white" strokeWidth={3} />
            </button>
          )}
        </div>
        <p className="px-5 pb-1 text-xs text-ink-400">
          처음 환율은 대략 값이에요. 추가한 뒤 금액 아래 환율(✎)에서 확인해 주세요.
        </p>
        {add.isError && (
          <p role="alert" className="px-5 pb-1 text-[13px] text-destructive">
            {add.error?.message.includes("changed by someone else")
              ? "다른 사람이 기준 화폐를 바꿨어요. 화면을 새로 불러온 뒤 다시 해 주세요."
              : "통화를 추가하지 못했어요. 다시 시도해 주세요."}
          </p>
        )}
        <ul className="min-h-0 flex-1 overflow-y-auto px-5 pt-1 pb-8">
          {list.map((c) => {
            const added = have.includes(c.code);
            return (
              <li key={c.code} className="flex h-15 items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-[17px] text-ink-900">
                  {c.country} - {c.code}({c.name})
                </span>
                {added ? (
                  <span className="shrink-0 px-1.5 text-sm font-bold text-primary">추가됨</span>
                ) : (
                  <button
                    type="button"
                    disabled={add.isPending || !defaultRate(c.code, home)}
                    onClick={() => pick(c.code)}
                    className="flex h-9.5 shrink-0 items-center rounded-full bg-surface-muted px-4 text-sm font-bold text-ink-700 disabled:opacity-50"
                  >
                    추가
                  </button>
                )}
              </li>
            );
          })}
          {list.length === 0 && (
            <li className="py-10 text-center text-sm text-ink-400">검색 결과가 없어요.</li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
