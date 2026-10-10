import { type City, useTripCities } from "@/entities/city";
import type { Memo, Place, ScheduleItem, TimelineRow } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { dayOfWeek } from "@/shared/lib/days";

import type { PlanEditState } from "../model/use-plan-edit";
import { type AlternativesSlot, DetailExtras } from "./detail-extras";
import { ExpenseBlock } from "./expense-block";
import { MemoBlock } from "./memo-block";
import { PlaceInfoBand } from "./place-info-band";
import { PlanSection } from "./plan-section";
import { StayBlock } from "./stay-block";

type DetailContentProps = {
  tripId: string;
  startDate: string;
  row: TimelineRow;
  plan: PlanEditState;
  /** 메모 「+ 메모」 · 메모 누르기 — 부른 쪽이 메모 작성 창을 연다(고칠 메모, 새로 쓰면 null) */
  onMemo: (memo: Memo | null) => void;
  /** 비용 「+」 · 비용 줄 — 부른 쪽이 비용 창을 연다(고칠 비용, 새로 쓰면 null — 이 일정에 연결된 채) */
  onExpense: (expenseId: string | null) => void;
  /** 대체 장소 칸. 대체 장소의 상세에서는 null(대체 장소의 대체 장소는 없다) */
  alternatives: AlternativesSlot | null;
  /** 「장소 정보 수정」 — 장소와 그 도시(위치를 바꿀 때 검색 범위)를 넘긴다 */
  onEditPlace: (place: Place, city: City | null) => void;
  /** 숙소 연결 카드의 「숙소 정보 수정」. 없으면(대체 장소의 상세) 「숙소 예약」 블록을 그리지 않는다 */
  onEditStay?: (stayId: string) => void;
  /** 숙소 탭에 없는 숙소 일정의 「숙소로 등록」. 없으면(대체 장소의 상세) 안내를 그리지 않는다 */
  onRegisterStay?: (item: ScheduleItem) => void;
};

/**
 * 일정 상세 본문 — 장소 정보(place 만) → 숙소 예약(숙소 연결 카드만) → 이번 일정 → 비용 → 메모 → 대체 장소(place 만, 대체 장소의 상세에서는 없다).
 * 비용 · 메모 · 대체 장소 칸은 값이 있을 때만 보이고, 빈 칸은 맨 아래 「추가」 줄의 칩으로 모은다(다 차면 줄이 없다).
 * 바우처 · 할 일은 각 단계에서 같은 규칙으로 들어온다. 모바일 · PC 가 같은 본문을 쓴다
 */
export function DetailContent({
  tripId,
  startDate,
  row,
  plan,
  onMemo,
  onExpense,
  alternatives,
  onEditPlace,
  onEditStay,
  onRegisterStay,
}: DetailContentProps) {
  const { data: cities = [] } = useTripCities(tripId);
  const { data: user } = useUser();
  const item = row.item;
  const place = item.place;
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
          onRegisterStay={registerStayOf(item, onRegisterStay)}
        />
      )}
      {item.stay_id && onEditStay && (
        <StayBlock tripId={tripId} stayId={item.stay_id} onEdit={onEditStay} />
      )}
      <PlanSection item={item} edit={plan} />
      <div aria-hidden="true" className="-mx-5 h-2 shrink-0 bg-surface-sunken" />
      <ExpenseBlock tripId={tripId} item={item} onOpen={onExpense} />
      <MemoBlock tripId={tripId} item={item} onAdd={() => onMemo(null)} onEdit={onMemo} />
      <DetailExtras
        tripId={tripId}
        row={row}
        alternatives={item.kind === "place" ? alternatives : null}
        city={city}
        onMemo={onMemo}
        onExpense={() => onExpense(null)}
      />
    </>
  );
}

/** 「숙소로 등록」 — 숙소 카테고리인데 숙소에 연결되지 않은 장소 일정만. 아니면 null(안내 숨김) */
function registerStayOf(
  item: ScheduleItem,
  onRegister: ((item: ScheduleItem) => void) | undefined,
): (() => void) | null {
  if (!onRegister || item.kind !== "place" || item.stay_id) return null;
  return item.place?.category === "stay" ? () => onRegister(item) : null;
}
