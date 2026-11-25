"use client";

import { Star } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { PinToggle } from "@/shared/ui/pin-toggle";
import { TimeField } from "@/shared/ui/time-field";

import type { NoteDraft } from "../lib/day-memo";
import { useMemoEditor } from "../model/use-memo-editor";
import { MemoEditor } from "./memo-editor";

type SetDraft = <K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) => void;

type MemoFieldsProps = {
  tripId: string;
  draft: NoteDraft;
  set: SetDraft;
  /** 「홈에 고정」 을 누를 수 있다(나를 안다) */
  pinReady: boolean;
  /** 사진을 올리는 중 — 칸을 모두 막는다(올리는 동안 사진 · 글이 바뀌면 저장값과 어긋난다) */
  disabled: boolean;
  error: string | null;
};

/**
 * 메모 창의 칸 — 첫 줄 시간(선택) · ☆ 중요 · 홈에 고정, 그 아래 글 상자(링크 · 사진 포함) · 오류.
 * 새 메모 · 고치기가 함께 쓴다
 */
export function MemoFields({ tripId, draft, set, pinReady, disabled, error }: MemoFieldsProps) {
  const editor = useMemoEditor(draft, set);
  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <TimeField
            value={draft.time}
            onChange={(time) => set("time", time)}
            aria-label="메모 시간(선택)"
          />
        </div>
        <button
          type="button"
          aria-pressed={draft.starred}
          onClick={() => set("starred", !draft.starred)}
          className={cn(
            "flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-[13px] font-bold",
            draft.starred
              ? "border-important-line bg-important-bg text-important-text"
              : "border-line bg-white text-ink-500",
          )}
        >
          <Star aria-hidden="true" className={cn("size-3.5", draft.starred && "fill-current")} />
          중요
        </button>
        <PinToggle
          pinned={draft.pinned}
          onToggle={() => set("pinned", !draft.pinned)}
          disabled={!pinReady}
        />
      </div>
      <MemoEditor tripId={tripId} draft={draft} editor={editor} />
      {error && <p className="text-[13px] text-destructive">{error}</p>}
    </fieldset>
  );
}
