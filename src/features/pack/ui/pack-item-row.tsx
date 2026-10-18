"use client";

import { Check } from "lucide-react";

import { isChecked, type PackItem } from "@/entities/pack";
import type { MemberBadge } from "@/entities/trip-member";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

type PackItemRowProps = {
  item: PackItem;
  /** 체크한 사람 — 나간 멤버면 null(아바타 없이 챙김만) */
  checker: MemberBadge | null;
  onToggle: () => void;
};

/**
 * 항목 한 줄(최소 48) — 체크박스 22 · r6(챙기면 블루 + 체크) · 이름 15/600(챙기면 회색 · 취소선) · 메모 12 ·
 * 오른쪽 체크한 사람 아바타 22. 체크해도 자리는 그대로(시안)
 */
export function PackItemRow({ item, checker, onToggle }: PackItemRowProps) {
  const done = isChecked(item);
  return (
    <li className="flex min-h-12 items-center gap-3 border-t border-surface-sunken px-4 py-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={item.name}
        onClick={onToggle}
        className={cn(
          "flex size-5.5 shrink-0 items-center justify-center rounded-pill-sm border-[1.5px] outline-10 outline-transparent",
          done ? "border-primary bg-primary" : "border-line-dashed bg-white",
        )}
      >
        {done && <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden="true" />}
      </button>
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "text-[15px] font-semibold wrap-break-word",
            done ? "text-ink-350 line-through" : "text-ink-900",
          )}
        >
          {item.name}
        </span>
        {item.memo && <span className="text-xs/[1.4] text-ink-400">{item.memo}</span>}
      </span>
      {done && checker && (
        <Avatar className="size-5.5 shrink-0" title={`${checker.name} 챙김`}>
          {checker.avatarUrl && <AvatarImage src={checker.avatarUrl} alt="" />}
          <AvatarFallback className="bg-primary text-[10px] font-extrabold text-white">
            {checker.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      )}
    </li>
  );
}
