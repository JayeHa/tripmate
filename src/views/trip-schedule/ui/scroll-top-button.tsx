"use client";

import { ArrowUp } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { type ScrollTarget, scrollToTop, useScrolledDown } from "../model/use-scrolled-down";

/** 이만큼 내려가면 버튼이 나타난다(px) — 여행 머리 · 첫 날짜를 지난 뒤 */
const SHOW_AFTER = 600;

type ScrollTopButtonProps = {
  target: ScrollTarget;
  /** 자리 — 모바일은 화면에 고정(「+ 추가」 위), PC 는 목록 칸 안(「+ 추가」 위) */
  className: string;
};

/**
 * 일정 「맨 위로」 — 흰 원 44 · 위 화살표 · 그림자. 600px 넘게 내려가면 나타나고, 누르면 맨 위(여행 머리)로 부드럽게 올라간다.
 * 맨 위에서는 숨어 누를 수 없다
 */
export function ScrollTopButton({ target, className }: ScrollTopButtonProps) {
  const down = useScrolledDown(target, SHOW_AFTER);
  return (
    <button
      type="button"
      aria-label="맨 위로"
      aria-hidden={!down}
      tabIndex={down ? undefined : -1}
      onClick={() => scrollToTop(target)}
      className={cn(
        "flex size-11 items-center justify-center rounded-full border border-divider bg-white text-ink-700 shadow-[0_4px_14px_rgba(0,0,0,0.14)] transition-opacity duration-200",
        !down && "pointer-events-none opacity-0",
        className,
      )}
    >
      <ArrowUp className="size-5" strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}
