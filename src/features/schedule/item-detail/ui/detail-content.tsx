import { type City, useTripCities } from "@/entities/city";
import type { Place, TimelineRow } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { dayOfWeek, dayParts } from "@/shared/lib/days";

import type { AlternativeActions } from "../model/use-alternative-actions";
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
  alternatives: AlternativeActions;
  /** 대체 장소 「+ 직접 추가」 — 장소 입력 폼을 이 일정의 대체 장소 모드로. 이 장소의 도시(검색 범위)를 넘긴다 */
  onAddAlternative: (city: City | null) => void;
  /** 「장소 정보 수정」 — 장소와 그 도시(위치를 바꿀 때 검색 범위)를 넘긴다 */
  onEditPlace: (place: Place, city: City | null) => void;
};

/**
 * 일정 상세 본문 — 장소 정보(place 만) → 이번 일정 → 메모 → 대체 장소(place 만).
 * 바우처 · 할 일은 노트 단계(f)에서 이번 일정과 메모 사이에 들어온다. 모바일 · PC 가 같은 본문을 쓴다
 */
export function DetailContent({
  tripId,
  startDate,
  row,
  plan,
  memo,
  alternatives,
  onAddAlternative,
  onEditPlace,
}: DetailContentProps) {
  const { data: cities = [] } = useTripCities(tripId);
  const { data: user } = useUser();
  const item = row.item;
  const place = item.place;
  const day = dayParts(startDate, item.day_index);
  const city = place ? (cities.find((c) => c.id === place.city_id) ?? null) : null;
  // 장소는 만든 사람만 고친다(RLS). 사용자를 아직 모르면 숨긴다 — 눌러도 DB 가 막지만 실패할 버튼을 보이지 않게
  const canEditPlace = !!place && !!user && place.created_by === user.id;
  return (
    <>
      {place && (
        <PlaceInfoBand
          place={place}
          cityName={city?.name ?? null}
          dow={dayOfWeek(startDate, item.day_index)}
          onEdit={canEditPlace ? () => onEditPlace(place, city) : null}
        />
      )}
      <PlanSection
        item={item}
        dayTag={`day ${item.day_index + 1} · ${day.date} 일정`}
        edit={plan}
      />
      <div aria-hidden="true" className="-mx-5 h-2 shrink-0 bg-surface-sunken" />
      <MemoBlock notes={row.notes} edit={memo} />
      {item.kind === "place" && (
        <AlternativesBlock
          tripId={tripId}
          main={item}
          alternatives={row.alternatives}
          actions={alternatives}
          onDirectAdd={() => onAddAlternative(city)}
        />
      )}
    </>
  );
}
