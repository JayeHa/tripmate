"use client";

import { X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { MobileRangeCalendar } from "@/shared/ui/range-calendar";

import { dateCtaLabel } from "../../lib/cta";
import { useCreateCalendar } from "../../model/use-create-calendar";
import type { TripCreateState } from "../../model/use-trip-create";
import { CreateError } from "../parts/create-error";
import type { TitleComponent } from "../parts/title";
import { MobileFooter } from "./mobile-footer";

type MobileDateStepProps = {
  state: TripCreateState;
  Title: TitleComponent;
};

/** 모바일 날짜 단계. 달력은 이번 달로 스크롤해 둔다 */
export function MobileDateStep({ state, Title }: MobileDateStepProps) {
  const calendar = useCreateCalendar(state.selection);
  const names = state.picked.map((c) => c.name).join("·");

  return (
    <>
      <div className="flex shrink-0 flex-col gap-2.5 border-b border-divider px-5 pt-1.5 pb-4">
        <IconButton
          label="도시 다시 고르기"
          onClick={state.backToCity}
          disabled={state.locked}
          className="self-start py-2 text-ink-900"
        >
          <X className="size-6" strokeWidth={2} />
        </IconButton>
        <Title className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
          여행일정 등록
        </Title>
        <p className="text-[15px] leading-normal text-ink-500">
          {names} · 날짜에 맞춰 날씨와 여행 정보를 알려드려요.
        </p>
      </div>
      <MobileRangeCalendar {...calendar} onPick={state.pick} />
      <MobileFooter>
        <CreateError state={state} />
        <Button
          size="cta"
          className="w-full"
          disabled={!state.selection?.end || state.create.isPending}
          onClick={state.submit}
        >
          {dateCtaLabel(state.selection, state.create.isPending)}
        </Button>
      </MobileFooter>
    </>
  );
}
