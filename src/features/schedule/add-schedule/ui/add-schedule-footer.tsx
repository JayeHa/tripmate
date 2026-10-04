import { X } from "lucide-react";

import { Button } from "@/shared/ui/button";

import type { AddScheduleState } from "../model/use-add-schedule";

type AddScheduleFooterProps = { state: AddScheduleState };

/** 고른 곳 칩 트레이(누르면 뺌) · 오류 문구 · CTA 「day N에 K곳 추가」 */
export function AddScheduleFooter({ state }: AddScheduleFooterProps) {
  const count = state.chosen.length;
  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-divider bg-white px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      {count > 0 && (
        <div className="flex gap-1.5 overflow-x-auto" aria-label="고른 장소">
          {state.chosen.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-label={`${c.name} 빼기`}
              onClick={() => state.removeChosen(c.key)}
              className="flex h-7.5 shrink-0 items-center gap-1 rounded-full bg-status-ok-bg pr-2 pl-3 text-[13px] font-bold text-status-ok"
            >
              {c.name}
              <X className="size-3.5" strokeWidth={2.4} />
            </button>
          ))}
        </div>
      )}
      {state.error && <p className="text-[13px] text-destructive">{state.error}</p>}
      <Button
        size="lg"
        className="h-13 w-full text-base font-bold"
        disabled={count === 0 || state.submitting}
        onClick={state.submit}
      >
        {count ? `day ${state.dayIndex + 1}에 ${count}곳 추가` : "장소를 선택하세요"}
      </Button>
    </div>
  );
}
