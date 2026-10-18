"use client";

import { Check } from "lucide-react";
import { cloneElement, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

/** 시트 한 줄 — FilterSelect 의 옵션과 같은 모양(서로 가져오지 않게 따로 둔다) */
type SheetRow = { value: string; label: string; sub?: string; icon?: React.ReactNode };

type SheetSelectProps = {
  /** 여는 버튼 — 칩 또는 부른 쪽이 준 버튼. 누르면 시트가 열린다 */
  trigger: React.ReactElement<{ onClick?: () => void; "aria-haspopup"?: "dialog" }>;
  title: string;
  options: SheetRow[];
  /** 고른 값. 「전체」 면 allValue */
  value: string;
  allValue: string;
  allLabel: string | null;
  onChange: (value: string) => void;
};

/**
 * 필터 고르기의 모바일 시트(P33) — 제목 18/800 + ✕, 줄 52 · 16/600(왼쪽 아이콘 · 아래 회색 보조 글), 고른 줄 블루 + ✓.
 * 누르면 바로 적용하고 닫힌다
 */
export function SheetSelect({
  trigger,
  title,
  options,
  value,
  allValue,
  allLabel,
  onChange,
}: SheetSelectProps) {
  const [open, setOpen] = useState(false);
  /** 고르고 닫는다 */
  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };
  const rows: SheetRow[] = [
    ...(allLabel === null ? [] : [{ value: allValue, label: allLabel }]),
    ...options,
  ];
  return (
    <>
      {cloneElement(trigger, { onClick: () => setOpen(true), "aria-haspopup": "dialog" })}
      <SheetDialog open={open} onClose={() => setOpen(false)} title={title}>
        <div role="listbox" aria-label={title} className="flex flex-col">
          {rows.map((o) => {
            const on = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => pick(o.value)}
                className={cn(
                  "flex min-h-13 items-center gap-3 py-1.5 text-left",
                  o.value === allValue && allLabel !== null && "border-b border-surface-muted",
                )}
              >
                {o.icon}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={cn(
                      "truncate text-base font-semibold",
                      on ? "text-brand-text" : "text-ink-900",
                    )}
                  >
                    {o.label}
                  </span>
                  {o.sub && <span className="truncate text-[13px] text-ink-400">{o.sub}</span>}
                </span>
                {on && <Check className="size-5 shrink-0 text-brand" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </SheetDialog>
    </>
  );
}
