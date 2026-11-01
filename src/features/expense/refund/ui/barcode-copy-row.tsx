"use client";

import { Copy } from "lucide-react";

import { useCopied } from "@/shared/lib/use-copied";

type BarcodeCopyRowProps = { value: string };

/**
 * 바코드 번호 줄(최소 46 · r12 · 회색) — 줄 전체가 복사 버튼. 라벨 11/700 · 번호 16/800(숫자 간격 넓게).
 * 누르면 오른쪽 글이 잠깐 「복사했어요」 로 바뀐다
 */
export function BarcodeCopyRow({ value }: BarcodeCopyRowProps) {
  const { copied, copy } = useCopied();
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className="flex min-h-11.5 w-full items-center gap-2.5 rounded-card bg-surface-muted px-3.5 py-1.5 text-left"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-bold text-ink-400">바코드 번호</span>
        <span className="text-base font-extrabold tracking-[0.03em] break-all text-ink-900 tabular-nums">
          {value}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-ink-400">
        {copied && <span aria-live="polite">복사했어요</span>}
        <Copy className="size-4" aria-label={copied ? undefined : "복사"} />
      </span>
    </button>
  );
}
