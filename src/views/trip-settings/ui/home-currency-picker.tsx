"use client";

import { useState } from "react";

import { CURRENCIES } from "@/shared/lib/money";
import { useOpenCount } from "@/shared/lib/use-dialog-state";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";

type HomeCurrencyPickerProps = {
  current: string;
  open: boolean;
  onClose: () => void;
  /** 다른 통화를 골라 「다음」 — 다시 계산 확인 창으로 */
  onPick: (code: string) => void;
};

/** 기준 화폐 고르기(설정 「기준 화폐」 줄) — 가운데 창, 통화 목록 하나와 「취소 | 다음」. 같은 통화면 다음이 흐리다 */
export function HomeCurrencyPicker({ current, open, onClose, onPick }: HomeCurrencyPickerProps) {
  const openCount = useOpenCount(open);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="grid-cols-[minmax(0,1fr)] gap-0 p-0 sm:max-w-100"
      >
        <PickerForm key={openCount} current={current} onClose={onClose} onPick={onPick} />
      </DialogContent>
    </Dialog>
  );
}

type PickerFormProps = Omit<HomeCurrencyPickerProps, "open">;

/** 창 안 — 열 때마다 지금 기준 화폐에서 시작한다 */
function PickerForm({ current, onClose, onPick }: PickerFormProps) {
  const [code, setCode] = useState(current);
  return (
    <form
      className="flex flex-col gap-3 px-5 pt-6 pb-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (code !== current) onPick(code);
      }}
    >
      <DialogTitle className="text-xl font-extrabold text-ink-900">기준 화폐</DialogTitle>
      <DialogDescription className="-mt-1.5 text-[13px]/normal text-ink-450">
        합계와 정산을 이 통화로 계산해요. 바꾸면 지출과 송금 기록을 새 기준으로 다시 계산해요.
      </DialogDescription>
      <select
        aria-label="기준 화폐"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="mt-1 h-11 rounded-memo border border-line bg-white px-2.5 text-[15px] text-ink-900 outline-none focus:border-primary"
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} · {c.name} ({c.country})
          </option>
        ))}
      </select>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="chip" size="form" className="flex-1" onClick={onClose}>
          취소
        </Button>
        <Button type="submit" size="form" className="flex-2" disabled={code === current}>
          다음
        </Button>
      </div>
    </form>
  );
}
