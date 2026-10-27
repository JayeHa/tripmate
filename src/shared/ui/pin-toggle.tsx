import { Pin } from "lucide-react";

import { cn } from "@/shared/lib/utils";

type PinToggleProps = {
  pinned: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * 「홈에 고정」 알약(32) — 꺼지면 회색 「홈에 고정」, 켜지면 블루 「고정됨」. 체크리스트 · 메모 · 날짜 메모 창이 함께 쓴다
 */
export function PinToggle({ pinned, onToggle, disabled = false, className }: PinToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={pinned}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-[13px] font-bold disabled:opacity-60",
        pinned ? "bg-primary text-white" : "bg-surface-muted text-ink-700",
        className,
      )}
    >
      <Pin className="size-3.5" aria-hidden="true" />
      {pinned ? "고정됨" : "홈에 고정"}
    </button>
  );
}
