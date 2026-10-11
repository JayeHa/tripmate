"use client";

import { CATEGORY_LABEL } from "@/entities/schedule-item";

import type { AddScheduleState } from "../model/use-add-schedule";
import { PlaceRow } from "./place-row";

type MyStayRowsProps = { state: AddScheduleState };

/**
 * 추천 장소 맨 위 「내 숙소」 묶음 — 이 여행의 숙소. 담을 날에 묵는 숙소가 먼저 오고, 그날 이미 있으면 「이 날 N번 있음」(그래도 고를 수 있다).
 * 담으면 그 숙소의 연결 카드가 된다. 숙소가 없거나 검색어에 맞는 것이 없으면 그리지 않는다
 */
export function MyStayRows({ state }: MyStayRowsProps) {
  if (state.myStays.length === 0) return null;
  return (
    <>
      <p className="px-5 pt-3.5 pb-1 text-[13px] font-extrabold text-ink-500">내 숙소</p>
      {state.myStays.map(({ stay, rangeText, times, countToday }) => (
        <PlaceRow
          key={stay.id}
          name={stay.place.name}
          category="stay"
          tag={`내 숙소 · ${rangeText}`}
          meta={CATEGORY_LABEL.stay}
          description={times}
          note={countToday > 0 ? `이 날 ${countToday}번 있음` : null}
          inTrip={false}
          chosen={state.isChosen(`stay:${stay.id}`)}
          onToggle={() => state.toggleStay(stay)}
        />
      ))}
    </>
  );
}
