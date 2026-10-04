import { useTripCities } from "@/entities/city";
import type { TimelineRow } from "@/entities/schedule-item";
import { dayOfWeek, dayParts } from "@/shared/lib/days";

import type { MemoEditState } from "../model/use-memo-edit";
import type { PlanEditState } from "../model/use-plan-edit";
import { AlternativesBlock } from "./alternatives-block";
import { MemoBlock } from "./memo-block";
import { PlaceInfoBand } from "./place-info-band";
import { PlanSection } from "./plan-section";

type DetailContentProps = {
  tripId: string;
  startDate: string;
  row: TimelineRow;
  plan: PlanEditState;
  memo: MemoEditState;
};

/**
 * 일정 상세 본문 — 장소 정보(place 만) → 이번 일정 → 메모 → 대체 장소(place 만).
 * 바우처 · 할 일은 노트 단계(f)에서 이번 일정과 메모 사이에 들어온다. 모바일 · PC 가 같은 본문을 쓴다
 */
export function DetailContent({ tripId, startDate, row, plan, memo }: DetailContentProps) {
  const { data: cities = [] } = useTripCities(tripId);
  const item = row.item;
  const place = item.place;
  const day = dayParts(startDate, item.day_index);
  const cityName = place ? (cities.find((c) => c.id === place.city_id)?.name ?? null) : null;
  return (
    <>
      {place && (
        <PlaceInfoBand
          place={place}
          cityName={cityName}
          dow={dayOfWeek(startDate, item.day_index)}
        />
      )}
      <PlanSection
        item={item}
        dayTag={`day ${item.day_index + 1} · ${day.date} 일정`}
        edit={plan}
      />
      <div aria-hidden="true" className="-mx-5 h-2 shrink-0 bg-surface-sunken" />
      <MemoBlock notes={row.notes} edit={memo} />
      {item.kind === "place" && <AlternativesBlock alternatives={row.alternatives} />}
    </>
  );
}
