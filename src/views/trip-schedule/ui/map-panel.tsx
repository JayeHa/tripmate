import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type MapPanelProps = {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

/**
 * 모바일 일정 상단의 접히는 지도(190px). 핸들을 누르면 190 ↔ 0 으로 접혀 일정에 집중한다.
 * 지도는 접혀도 언마운트하지 않는다 — 다시 펼칠 때 타일을 새로 받지 않게.
 */
export function MapPanel({ open, onToggle, children }: MapPanelProps) {
  return (
    <div className="bg-white">
      <div
        className={cn(
          "overflow-hidden transition-[height] duration-300 ease-out",
          open ? "h-47.5" : "h-0",
        )}
      >
        <div className="h-47.5">{children}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "지도 접기" : "지도 펼치기"}
        className="flex w-full justify-center pt-2 pb-1.5"
      >
        <svg
          width="40"
          height="12"
          viewBox="0 0 40 12"
          fill="none"
          aria-hidden="true"
          className={cn("stroke-handle transition-transform duration-300", !open && "rotate-180")}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 9l16-5 16 5" />
        </svg>
      </button>
    </div>
  );
}
