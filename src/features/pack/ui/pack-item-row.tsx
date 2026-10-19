"use client";

import { Check, Trash2 } from "lucide-react";

import { isChecked, type PackItem } from "@/entities/pack";
import type { MemberBadge } from "@/entities/trip-member";
import { cn } from "@/shared/lib/utils";

import { SWIPE_REVEAL, useSwipeReveal } from "../model/use-swipe-reveal";
import { CheckerAvatar } from "./checker-avatar";

type PackItemRowProps = {
  item: PackItem;
  /** 체크한 사람 — 나간 멤버면 null(아바타 없이 챙김만) */
  checker: MemberBadge | null;
  /** 왼쪽으로 밀어 「삭제」 가 드러나 있는가 */
  swiped: boolean;
  onSwipedChange: (open: boolean) => void;
  onToggle: () => void;
  /** 줄을 눌렀다(체크박스 밖) — 상세 열기 */
  onOpen: () => void;
  onDelete: () => void;
};

/**
 * 항목 한 줄(최소 48) — 체크박스 22 · r6(챙기면 블루 + 체크) · 이름 15/600(챙기면 회색 · 취소선) · 메모 12 ·
 * 오른쪽 체크한 사람 아바타 22. 체크해도 자리는 그대로.
 * 체크박스만 챙김을 바꾸고, 나머지를 누르면 상세. 왼쪽으로 밀면 뒤에 76 빨간 「삭제」(PC 는 마우스로 끌기)
 */
export function PackItemRow({
  item,
  checker,
  swiped,
  onSwipedChange,
  onToggle,
  onOpen,
  onDelete,
}: PackItemRowProps) {
  const done = isChecked(item);
  const swipe = useSwipeReveal(swiped, onSwipedChange);
  return (
    <li className="relative overflow-hidden border-t border-surface-sunken">
      <button
        type="button"
        onClick={onDelete}
        tabIndex={swiped ? 0 : -1}
        aria-hidden={!swiped}
        // 닫혀 있으면 숨긴다 — 줄이 덮어도 가장자리 반 픽셀에 빨강이 비친다
        className={cn(
          "absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-0.5 bg-destructive text-xs font-bold text-white",
          swipe.x === 0 && "invisible",
        )}
        style={{ width: SWIPE_REVEAL }}
      >
        <Trash2 className="size-4.5" aria-hidden="true" />
        삭제
      </button>
      <div
        {...swipe.handlers}
        onClick={onOpen}
        className={cn(
          "relative flex min-h-12 cursor-pointer touch-pan-y items-center gap-3 bg-white px-4 py-2.5 select-none",
          !swipe.dragging && "transition-transform duration-200 ease-out",
        )}
        style={{ transform: `translateX(${swipe.x}px)` }}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={item.name}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            "flex size-5.5 shrink-0 items-center justify-center rounded-pill-sm border-[1.5px] outline-10 outline-transparent",
            done ? "border-primary bg-primary" : "border-line-dashed bg-white",
          )}
        >
          {done && <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden="true" />}
        </button>
        <button
          type="button"
          aria-label={`${item.name} 자세히`}
          className="flex min-w-0 flex-1 flex-col text-left"
        >
          <span
            className={cn(
              "text-[15px] font-semibold wrap-break-word",
              done ? "text-ink-350 line-through" : "text-ink-900",
            )}
          >
            {item.name}
          </span>
          {item.memo && <span className="text-xs/[1.4] text-ink-400">{item.memo}</span>}
        </button>
        {done && checker && <CheckerAvatar checker={checker} />}
      </div>
    </li>
  );
}
