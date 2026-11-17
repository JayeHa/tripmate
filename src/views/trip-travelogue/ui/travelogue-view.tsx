"use client";

import { useSearchParams } from "next/navigation";

import { type Travelogue, useTravelogue } from "../model/use-travelogue";
import { Cover } from "./cover";
import { DayCard } from "./day-card";
import { DayRead } from "./day-read";
import { DayToc } from "./day-toc";
import { TopBar } from "./top-bar";

type TripTravelogueViewProps = { tripId: string };

/**
 * 여행기 — 기록을 일정 순서대로 엮어 읽는 화면. 하루씩: 커버 + 하루 카드 목록 → 카드를 누르면 그날 읽기(`?day=2`).
 * 열리지 않은 날 · 범위 밖의 day 는 목록으로 보인다. PC 는 왼쪽에 day 목차, 가운데 680 칼럼
 */
export function TripTravelogueView({ tripId }: TripTravelogueViewProps) {
  const t = useTravelogue(tripId);
  const asked = Number(useSearchParams().get("day")) - 1;
  const current = t.days.find((d) => d.day === asked && d.open) ?? null;
  if (!t.ready || !t.trip) return <main className="flex-1 bg-surface-sunken" aria-busy />;
  const base = `/trips/${tripId}/travelogue`;
  return (
    <main className="flex flex-1 flex-col bg-surface-sunken lg:bg-white">
      <div className="w-full lg:mx-auto lg:flex lg:max-w-262 lg:gap-10 lg:px-10 lg:pt-6 lg:pb-12">
        <DayToc
          trip={t.trip}
          days={t.days}
          current={current?.day ?? null}
          base={base}
          holidayOf={t.holidayOf}
        />
        <div className="min-w-0 flex-1 lg:max-w-170">
          <TopBar
            tripId={tripId}
            trip={t.trip}
            day={current}
            base={base}
            holiday={current ? t.holidayOf(current.day) : null}
          />
          {current ? (
            <DayRead
              tripId={tripId}
              trip={t.trip}
              days={t.days}
              day={current}
              base={base}
              holiday={t.holidayOf(current.day)}
              uploader={t.uploader}
              shared={t.members.length > 1}
            />
          ) : (
            <Overview t={t} tripId={tripId} base={base} />
          )}
        </div>
      </div>
    </main>
  );
}

type OverviewProps = { t: Travelogue; tripId: string; base: string };

/** 하루씩의 첫 화면 — 커버 + 하루 카드(바탕 회색, 사이 14) */
function Overview({ t, tripId, base }: OverviewProps) {
  if (!t.trip) return null;
  return (
    <div className="flex flex-col gap-3.5 px-4 pb-8 lg:px-0">
      <Cover trip={t.trip} totals={t.totals} members={t.members} traveling={t.traveling} />
      {t.days.map((d) => (
        <DayCard
          key={d.day}
          tripId={tripId}
          startDate={t.trip?.start_date ?? ""}
          day={d}
          href={`${base}?day=${d.day + 1}`}
          holiday={t.holidayOf(d.day)}
        />
      ))}
    </div>
  );
}
