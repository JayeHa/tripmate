import { ArrowLeft, X } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { DialogTitle } from "@/shared/ui/dialog";

type StaysHeaderProps = {
  title: string;
  /** 왼쪽 — 닫기(✕) 또는 뒤로(←) */
  back: { kind: "close" | "back"; onClick: () => void };
  /** 오른쪽 글자 버튼(상세의 「수정」 · 폼의 「완료」) */
  action?: { label: string; onClick: () => void; disabled?: boolean } | null;
  /** 요청이 서버에 가 있는 동안 — 뒤로를 막는다 */
  locked?: boolean;
};

/** 숙소 창 머리 56 — ✕/← 24 · 제목 18/700 · 오른쪽 글자 버튼 */
export function StaysHeader({ title, back, action = null, locked = false }: StaysHeaderProps) {
  const Icon = back.kind === "close" ? X : ArrowLeft;
  return (
    <div className="flex h-14 shrink-0 items-center gap-3.5 pr-6 pl-5">
      <button
        type="button"
        aria-label={back.kind === "close" ? "닫기" : "뒤로"}
        onClick={back.onClick}
        disabled={locked}
        className="flex text-ink-900 disabled:opacity-40"
      >
        <Icon className="size-6" strokeWidth={2} />
      </button>
      <DialogTitle className="flex-1 truncate text-lg font-bold text-ink-900">{title}</DialogTitle>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            "px-0.5 py-2 text-[15px] font-bold text-brand-text",
            action.disabled && "text-ink-350",
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
