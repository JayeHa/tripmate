"use client";

import { Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/utils";

/** 「복사했어요」 를 보이는 시간 */
const COPIED_MS = 1400;

type NumberCopyRowProps = {
  /** 「예약번호 · 정원 (나)」 */
  label: string;
  value: string;
  /** 내 번호 — 연한 파랑, 그 밖은 회색 */
  mine: boolean;
};

/**
 * 번호 한 줄(최소 46 · r12) — 줄 전체가 복사 버튼. 라벨 11/700 · 값 16/800, 오른쪽 복사 아이콘.
 * 누르면 오른쪽 글이 1.4초 「복사했어요」 로 바뀐다(토스트 없이). 복사하지 못하면(권한 · 오래된 브라우저) 바뀌지 않는다
 */
export function NumberCopyRow({ label, value, mine }: NumberCopyRowProps) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(t);
  }, [copied]);
  const tone = mine ? "text-brand-text" : "text-ink-400";
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(
          () => setCopied(true),
          () => undefined,
        );
      }}
      className={cn(
        "flex min-h-11.5 w-full items-center gap-2.5 rounded-card px-3.5 py-1.5 text-left",
        mine ? "bg-brand-soft" : "bg-surface-muted",
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("truncate text-[11px] font-bold", tone)}>{label}</span>
        <span className="text-base font-extrabold tracking-[0.03em] break-all text-ink-900">
          {value}
        </span>
      </span>
      <span className={cn("flex shrink-0 items-center gap-1 text-xs font-bold", tone)}>
        {copied && <span aria-live="polite">복사했어요</span>}
        <Copy className="size-4" aria-label={copied ? undefined : "복사"} />
      </span>
    </button>
  );
}
