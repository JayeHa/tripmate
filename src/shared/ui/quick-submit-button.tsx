"use client";

import { cn } from "@/shared/lib/utils";

type QuickSubmitButtonProps = {
  /** 칸에 글이 있는가 — 있으면 블루, 없으면 회색(눌러도 아무것도 하지 않는다) */
  active: boolean;
  onSubmit: () => void;
  /** md 34 · 14/700(빠른 추가 바 · 그룹 추가), sm 32 · 13/700(그룹 안 항목 줄) */
  size?: "md" | "sm";
};

/**
 * 빠른 추가 칸 오른쪽 「등록」 — 모바일(1024 아래)은 늘 보이고, PC 는 글이 있을 때만 보인다(Enter 로 담는 것이 기본이라).
 * 누를 때 입력 칸의 포커스를 지킨다(mousedown 기본 동작 막기) — 키보드가 내려가지 않고 이어서 친다.
 * 빈 칸이면 disabled 대신 아무것도 하지 않는다 — disabled 버튼을 누르면 입력 칸이 포커스를 잃는다
 */
export function QuickSubmitButton({ active, onSubmit, size = "md" }: QuickSubmitButtonProps) {
  return (
    <button
      type="button"
      aria-disabled={!active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        if (active) onSubmit();
      }}
      className={cn(
        "flex shrink-0 items-center rounded-button px-3 font-bold whitespace-nowrap",
        size === "md" ? "h-8.5 text-sm" : "h-8 text-[13px]",
        active ? "bg-primary text-white" : "bg-surface-muted text-ink-350 lg:hidden",
      )}
    >
      등록
    </button>
  );
}
