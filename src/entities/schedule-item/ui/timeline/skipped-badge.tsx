import { Ban } from "lucide-react";

/** 「패스」 — 일정엔 넣었지만 가지 않은 곳. 예약 배지와 같은 크기(20 · r5 · 11/800) */
export function SkippedBadge() {
  return (
    <span className="mb-0.5 inline-flex h-5 w-fit items-center gap-0.75 rounded-[5px] bg-surface-muted px-1.5 text-[11px] font-extrabold text-ink-500">
      <Ban className="size-3" strokeWidth={2.2} />
      패스
    </span>
  );
}
