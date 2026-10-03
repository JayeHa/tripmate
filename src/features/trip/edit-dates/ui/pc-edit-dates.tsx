"use client";

import { X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { PcRangeCalendar } from "@/shared/ui/range-calendar";

import { editCtaLabel } from "../lib/cta";
import { useEditCalendar } from "../model/use-edit-calendar";
import type { EditDatesState } from "../model/use-edit-dates";
import type { TitleComponent } from "./title";

type PcEditDatesProps = {
  state: EditDatesState;
  onClose: () => void;
  Title: TitleComponent;
};

/** PC 기간 수정 (시안 6c 수정 모드). 760×660 모달 안, 이 여행의 출발 달부터 */
export function PcEditDates({ state, onClose, Title }: PcEditDatesProps) {
  const calendar = useEditCalendar(state.trip, state.selection);
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex shrink-0 items-center gap-3 px-7 pt-5.5 pb-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <Title className="text-[22px] font-extrabold tracking-[-0.02em] text-ink-900">
            여행일정 수정
          </Title>
          <p className="text-sm text-ink-400">바꿀 출발일과 도착일을 눌러 주세요.</p>
        </div>
        <IconButton label="닫기" onClick={onClose} disabled={state.locked} className="text-ink-400">
          <X className="size-6" strokeWidth={2} />
        </IconButton>
      </div>
      <PcRangeCalendar {...calendar} onPick={state.pick} />
      {state.error && <p className="shrink-0 px-7 pb-2 text-sm text-destructive">{state.error}</p>}
      <div className="flex shrink-0 items-center gap-4 border-t border-divider px-7 pt-3.5 pb-4.5">
        <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink-800">
          {state.trip.title}
        </span>
        <Button
          size="cta"
          className="w-70 shrink-0"
          disabled={!state.selection?.end || state.unchanged || state.busy}
          onClick={state.submit}
        >
          {editCtaLabel(state.selection, state.unchanged, state.busy)}
        </Button>
      </div>
    </div>
  );
}
