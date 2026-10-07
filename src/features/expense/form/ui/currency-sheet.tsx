"use client";

import { Check, CirclePlus } from "lucide-react";
import { useState } from "react";

import { currencyInfo, currencyName } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import type { ExpenseFormState } from "../model/use-expense-form";
import { CurrencyPicker } from "./currency-picker";

type CurrencySheetProps = {
  form: Pick<ExpenseFormState, "tripId" | "home" | "currencies" | "currency" | "setCurrency">;
  open: boolean;
  onClose: () => void;
};

/** 통화 줄 이름 — 「일본 - JPY(엔)」, 목록에 없는 통화는 「XYZ(XYZ)」 */
function label(code: string) {
  const country = currencyInfo(code)?.country;
  return `${country ? `${country} - ` : ""}${code}(${currencyName(code)})`;
}

/**
 * 금액 칸의 「통화 선택」 — 이 여행의 통화(기준 화폐 + 여행 환율) 중 하나, 맨 아래 「⊕ 다른 통화 추가」 는 검색 화면을 연다.
 * 더한 통화는 바로 골라지고 시트도 닫힌다
 */
export function CurrencySheet({ form, open, onClose }: CurrencySheetProps) {
  const [picking, setPicking] = useState(false);
  /** 그 통화로 바꾸고 닫는다 */
  function choose(code: string) {
    form.setCurrency(code);
    setPicking(false);
    onClose();
  }
  return (
    <>
      <SheetDialog open={open && !picking} onClose={onClose} title="통화 선택">
        {form.currencies.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => choose(code)}
            className={cn(
              "flex h-13.5 w-full items-center text-[17px] font-bold",
              code === form.currency ? "text-primary" : "text-ink-900",
            )}
          >
            <span className="flex-1 truncate text-left">{label(code)}</span>
            {code === form.currency && <Check className="size-6" aria-hidden="true" />}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex h-13.5 w-full items-center gap-2.5 text-[17px] font-semibold text-primary"
        >
          <CirclePlus aria-hidden="true" className="size-6.5" strokeWidth={1.6} />
          다른 통화 추가
        </button>
      </SheetDialog>
      <CurrencyPicker
        open={open && picking}
        onClose={() => setPicking(false)}
        tripId={form.tripId}
        home={form.home}
        have={form.currencies}
        onPicked={choose}
      />
    </>
  );
}
