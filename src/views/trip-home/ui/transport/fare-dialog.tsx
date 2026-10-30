"use client";

import { useState } from "react";

import { currencyName, decimalsOf } from "@/shared/lib/money";
import { useHeldWhileClosing, useOpenCount, useReportLock } from "@/shared/lib/use-dialog-state";
import { Button } from "@/shared/ui/button";
import { FilterChip } from "@/shared/ui/filter-chip";
import { Input } from "@/shared/ui/input";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import {
  FARE_MEMO_MAX,
  FARE_TITLE_MAX,
  type FareTarget,
  useFareForm,
} from "../../model/use-fare-form";
import { DeleteFareButton } from "./delete-fare-button";

type FareDialogProps = {
  tripId: string;
  /** 고칠 줄 — null 이면 닫혀 있다 */
  target: FareTarget | null;
  /** 날짜 줄의 제목(「day 1 · 10.31 (토)」) */
  dayTitle: (dayIndex: number) => string;
  currencies: string[];
  startCurrency: string;
  onClose: () => void;
};

/** 머리 제목 — 날짜 줄은 그날, 날짜 밖 줄은 새로 · 고치기 */
function titleOf(target: FareTarget, dayTitle: (dayIndex: number) => string): string {
  if (target.kind === "day") return dayTitle(target.dayIndex);
  return target.fare ? "교통비 고치기" : "다른 교통비 추가";
}

/**
 * 교통비 한 줄 고치기 — 모바일 바텀시트 · PC 가운데 480. 날짜 밖 줄은 이름(공항 왕복 · 패스)부터.
 * 금액은 1인 기준, 통화가 둘 이상이면 칩으로 고른다. 닫히는 동안 내용을 유지하고, 열 때마다 새로 그린다
 */
export function FareDialog({ target, onClose, dayTitle, ...rest }: FareDialogProps) {
  const open = target !== null;
  const shown = useHeldWhileClosing(open, target);
  const count = useOpenCount(open);
  const [locked, setLocked] = useState(false);
  return (
    <SheetDialog
      open={open}
      onClose={onClose}
      title={shown ? titleOf(shown, dayTitle) : undefined}
      ariaTitle="교통비"
      locked={locked}
    >
      {shown && (
        <FareBody key={count} target={shown} onClose={onClose} onLockChange={setLocked} {...rest} />
      )}
    </SheetDialog>
  );
}

type FareBodyProps = Omit<FareDialogProps, "target" | "dayTitle"> & {
  target: FareTarget;
  onLockChange: (locked: boolean) => void;
};

/** 칸 묶음 — 상태는 useFareForm */
function FareBody({
  tripId,
  target,
  currencies,
  startCurrency,
  onClose,
  onLockChange,
}: FareBodyProps) {
  const form = useFareForm(tripId, target, startCurrency, onClose);
  useReportLock(form.pending, onLockChange);
  return (
    <div className="flex flex-col gap-4">
      {target.kind === "extra" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-ink-700">이름</span>
          <Input
            value={form.title}
            onChange={(e) => form.setTitle(e.target.value)}
            maxLength={FARE_TITLE_MAX}
            placeholder="공항 왕복 · 교통 패스"
            autoFocus={!target.fare}
          />
        </label>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fare-amount" className="text-[13px] font-bold text-ink-700">
          1인 금액 <span className="font-medium text-ink-350">(선택)</span>
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="fare-amount"
            value={form.amount}
            onChange={(e) => form.setAmount(e.target.value)}
            inputMode={decimalsOf(form.currency) === 0 ? "numeric" : "decimal"}
            autoComplete="off"
            placeholder="0"
            className="flex-1 text-right tabular-nums"
          />
          <span className="shrink-0 text-[15px] font-semibold text-ink-700">
            {currencyName(form.currency)}
          </span>
        </div>
        {currencies.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="통화">
            {currencies.map((c) => (
              <FilterChip
                key={c}
                size="sm"
                selected={c === form.currency}
                onClick={() => form.setCurrency(c)}
              >
                {currencyName(c)}
              </FilterChip>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-[13px] font-bold text-ink-700">
          경로 · 메모
          <span className="text-xs font-medium text-ink-350">
            {form.memo.length}/{FARE_MEMO_MAX}
          </span>
        </span>
        <textarea
          value={form.memo}
          onChange={(e) => form.setMemo(e.target.value)}
          maxLength={FARE_MEMO_MAX}
          rows={4}
          aria-label="경로 · 메모"
          placeholder="호텔 → 도쿄역 → 스카이트리"
          className="w-full resize-none rounded-memo border border-line px-3.5 py-3 text-[15px]/relaxed text-ink-900 outline-none placeholder:text-ink-350 focus:border-primary"
        />
      </div>
      {form.error && <p className="text-[13px] text-destructive">{form.error}</p>}
      <div className="flex items-center gap-2">
        {form.canDelete && <DeleteFareButton disabled={form.pending} onConfirm={form.destroy} />}
        <Button
          variant="chip"
          size="form"
          className="ml-auto w-24"
          disabled={form.pending}
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          size="form"
          className="w-36"
          disabled={!form.canSave || form.pending}
          onClick={form.submit}
        >
          저장
        </Button>
      </div>
    </div>
  );
}
