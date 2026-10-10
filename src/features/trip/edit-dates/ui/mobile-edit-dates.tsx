"use client";

import { X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { MobileRangeCalendar } from "@/shared/ui/range-calendar";

import { editCtaLabel } from "../lib/cta";
import { useEditCalendar } from "../model/use-edit-calendar";
import type { EditDatesState } from "../model/use-edit-dates";
import type { TitleComponent } from "./title";

type MobileEditDatesProps = {
  state: EditDatesState;
  onClose: () => void;
  Title: TitleComponent;
};

/** 모바일 기간 수정. 출발 달로 스크롤해 둔다 */
export function MobileEditDates({ state, onClose, Title }: MobileEditDatesProps) {
  const calendar = useEditCalendar(state.trip, state.selection);
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex shrink-0 flex-col gap-2.5 border-b border-divider px-5 pt-1.5 pb-4">
        <IconButton
          label="닫기"
          onClick={onClose}
          disabled={state.locked}
          className="self-start py-2 text-ink-900"
        >
          <X className="size-6" strokeWidth={2} />
        </IconButton>
        <Title className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
          여행일정 수정
        </Title>
        <p className="text-[15px]/normal text-ink-500">
          {state.trip.title} · 바꿀 출발일과 도착일을 눌러 주세요.
        </p>
      </div>
      <MobileRangeCalendar {...calendar} onPick={state.pick} />
      <div className="flex shrink-0 flex-col gap-3 border-t border-divider bg-white px-5 pt-3 pb-[calc(34px+env(safe-area-inset-bottom))]">
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button
          size="cta"
          className="w-full"
          disabled={!state.selection?.end || state.unchanged || state.busy}
          onClick={state.submit}
        >
          {editCtaLabel(state.selection, state.unchanged, state.busy)}
        </Button>
      </div>
    </div>
  );
}
