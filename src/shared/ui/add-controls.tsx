import { cn } from "cn";
import { type LucideIcon, Plus } from "lucide-react";
import type * as React from "react";

type CircleAddButtonProps = {
  /** 읽기 프로그램용 이름(「메모 추가」) */
  label: string;
  onClick: () => void;
};

/** 값이 있는 칸에 하나 더 넣기(P11) — 칸 제목 오른쪽 26 회색 원 + Plus 15 */
export function CircleAddButton({ label, onClick }: CircleAddButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-500 hover:bg-line"
    >
      <Plus className="size-3.75" strokeWidth={2.2} />
    </button>
  );
}

type AddChipRowProps = { children: React.ReactNode; className?: string };

/** 값 없는 칸 모음(P11) — 맨 아래 한 줄 「추가」 + 회색 칩. 칩이 없으면 쓰는 쪽에서 그리지 않는다 */
export function AddChipRow({ children, className }: AddChipRowProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-surface-muted pt-3.5",
        className,
      )}
    >
      <span className="mr-0.5 text-[13px] font-bold text-ink-400">추가</span>
      {children}
    </div>
  );
}

type AddChipProps = { icon: LucideIcon; label: string; onClick: () => void };

/** 「추가」 줄의 칩 — 32 · r16 · #F2F3F5 · 아이콘 14 + 13/700 #444. 누르면 그 칸의 입력 창을 연다 */
export function AddChip({ icon: Icon, label, onClick }: AddChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 items-center gap-1 rounded-full bg-surface-muted px-3 text-[13px] font-bold text-ink-700 hover:bg-line"
    >
      <Icon className="size-3.5 text-ink-500" />
      {label}
    </button>
  );
}
