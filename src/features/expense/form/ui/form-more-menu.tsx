"use client";

import { CircleDollarSign, Ellipsis } from "lucide-react";
import { useState } from "react";

import { SheetDialog } from "@/shared/ui/sheet-dialog";

type FormMoreMenuProps = {
  /** 「환율설정」 — 이 비용 환율 창을 연다 */
  onRate: () => void;
};

/** 비용 입력 머리 오른쪽 ⋯ — 아래에서 올라오는 메뉴(지금은 「환율설정」 하나) */
export function FormMoreMenu({ onRate }: FormMoreMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="더 보기"
        onClick={() => setOpen(true)}
        className="flex text-ink-900"
      >
        <Ellipsis className="size-6" />
      </button>
      <SheetDialog open={open} onClose={() => setOpen(false)} ariaTitle="더 보기">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onRate();
          }}
          className="flex h-14 w-full items-center gap-3.5"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-surface-muted">
            <CircleDollarSign aria-hidden="true" className="size-5 text-ink-700" />
          </span>
          <span className="text-[17px] font-semibold text-ink-900">환율설정</span>
        </button>
      </SheetDialog>
    </>
  );
}
