"use client";

import { X } from "lucide-react";
import { useState } from "react";

import type { Trip } from "@/entities/trip";
import { CURRENCY_OPTIONS, currencyName } from "@/shared/lib/money";
import { useOpenCount, useReportLock } from "@/shared/lib/use-dialog-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";

import type { RateDraft } from "../lib/rate-draft";
import { type RatesDraftState, useRatesDraft } from "../model/use-rates-draft";

type RatesDialogProps = {
  trip: Trip;
  /** 여행지 통화(첫 도시) — 여행 환율에 없으면 대략 값을 채운 줄로 시작한다 */
  destination: string | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

/**
 * 여행 환율(설정 「환율」 줄) — 가운데 440 창. 줄마다 [통화 ⌄][단위] = [값] 기준 화폐 ✕, 「+ 추가」, 「취소 | 저장」.
 * 열 때마다 지금 여행 환율에서 새로 시작한다. 바뀐 것이 없거나 칸이 잘못되면 저장이 흐리다
 */
export function RatesDialog({ trip, destination, open, onClose, onSaved }: RatesDialogProps) {
  const openCount = useOpenCount(open);
  const [locked, setLocked] = useState(false);
  return (
    <Dialog open={open} locked={locked} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="grid-cols-[minmax(0,1fr)] gap-0 p-0 sm:max-w-110"
      >
        <RatesForm
          key={openCount}
          trip={trip}
          destination={destination}
          onClose={onClose}
          onSaved={onSaved}
          onLockChange={setLocked}
        />
      </DialogContent>
    </Dialog>
  );
}

type RatesFormProps = Omit<RatesDialogProps, "open"> & {
  /** 저장 중에는 창을 닫지 못하게 */
  onLockChange: (locked: boolean) => void;
};

/** 창 안 — 입력과 저장 */
function RatesForm({ trip, destination, onClose, onSaved, onLockChange }: RatesFormProps) {
  const r = useRatesDraft(trip, destination, onSaved);
  useReportLock(r.pending, onLockChange);
  const home = trip.home_currency;
  return (
    <form
      className="flex flex-col gap-3 px-5 pt-6 pb-5"
      onSubmit={(e) => {
        e.preventDefault();
        r.submit();
      }}
    >
      <DialogTitle className="text-xl font-extrabold text-ink-900">여행 환율</DialogTitle>
      <DialogDescription className="-mt-1.5 text-[13px]/normal text-ink-450">
        지출을 {currencyName(home)}({home})으로 환산할 때 써요. 국내 여행이면 비워 두세요.
      </DialogDescription>
      <ul className="flex flex-col gap-2 pt-1">
        {r.drafts.map((d) => (
          <RateLine key={d.id} draft={d} home={home} r={r} />
        ))}
      </ul>
      <button
        type="button"
        onClick={r.add}
        className="self-start text-sm font-bold text-brand-text"
      >
        + 통화 추가
      </button>
      <Notes r={r} />
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="chip"
          size="form"
          className="flex-1"
          disabled={r.pending}
          onClick={onClose}
        >
          취소
        </Button>
        <Button type="submit" size="form" className="flex-2" disabled={!r.canSave}>
          {r.pending ? "저장하는 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}

type RateLineProps = { draft: RateDraft; home: string; r: RatesDraftState };

/** 한 줄 — 통화 74 · 단위 52 · 「=」 · 값 · 기준 화폐 · ✕ */
function RateLine({ draft, home, r }: RateLineProps) {
  const field =
    "h-10 rounded-button border border-line bg-white px-2 text-sm text-ink-900 outline-none focus:border-primary";
  return (
    <li className="flex items-center gap-1.5">
      <select
        aria-label="통화"
        value={draft.code}
        onChange={(e) => r.edit(draft.id, { code: e.target.value })}
        className={cn(field, "w-20 shrink-0")}
      >
        {CURRENCY_OPTIONS.filter((c) => c !== home).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        aria-label={`${draft.code} 단위`}
        inputMode="numeric"
        value={draft.unit}
        onChange={(e) => r.edit(draft.id, { unit: e.target.value.replace(/\D/g, "") })}
        className={cn(field, "w-14 shrink-0")}
      />
      <span className="text-ink-400">=</span>
      <input
        aria-label={`${draft.code} 환율`}
        inputMode="decimal"
        value={draft.value}
        onChange={(e) => r.edit(draft.id, { value: e.target.value.replace(/[^\d.,]/g, "") })}
        className={cn(field, "min-w-0 flex-1")}
      />
      <span className="w-8 shrink-0 text-[13px] text-ink-350">{home}</span>
      <button
        type="button"
        aria-label={`${draft.code} 빼기`}
        onClick={() => r.remove(draft.id)}
        className="flex size-7 shrink-0 items-center justify-center text-ink-700"
      >
        <X className="size-4.5" />
      </button>
    </li>
  );
}

type NotesProps = { r: RatesDraftState };

/** 줄 아래 안내 — 빈 목록 · 입력 오류 · 지출이 쓰는 통화를 뺄 때 · 저장 실패 */
function Notes({ r }: NotesProps) {
  return (
    <>
      {r.drafts.length === 0 && (
        <p className="text-[13px] text-ink-350">여행 환율이 없어요. 기준 화폐로만 기록돼요.</p>
      )}
      {r.error && <p className="text-[13px] text-destructive">{r.error}</p>}
      {r.inUse.map((u) => (
        <p key={u.code} className="text-[13px] text-destructive">
          {u.code} 지출 {u.count}건이 합계에서 빠져요.
        </p>
      ))}
      {r.saveError && (
        <p role="alert" className="text-[13px] text-destructive">
          {r.saveError}
        </p>
      )}
    </>
  );
}
