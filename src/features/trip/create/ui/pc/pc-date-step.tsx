"use client";

import { PcRangeCalendar } from "@/shared/ui/range-calendar";

import { useCreateCalendar } from "../../model/use-create-calendar";
import type { TripCreateState } from "../../model/use-trip-create";

type PcDateStepProps = { state: TripCreateState };

/** PC 날짜 단계 본문 (시안 6c). 두 달 나란히, 처음엔 이번 달부터 */
export function PcDateStep({ state }: PcDateStepProps) {
  const calendar = useCreateCalendar(state.selection);
  return <PcRangeCalendar {...calendar} onPick={state.pick} />;
}
