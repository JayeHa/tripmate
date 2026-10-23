"use client";

import { Ellipsis } from "lucide-react";
import type { ReactNode } from "react";

import {
  type groupTrips,
  type Trip,
  TripCard,
  type TripListItem,
  TripRow,
  TripRowCompact,
} from "@/entities/trip";
import { IconButton } from "@/shared/ui/icon-button";

import { CreateTripTile } from "./create-trip-card";

type TripGroupsProps = {
  groups: ReturnType<typeof groupTrips<TripListItem>>;
  today: string;
  /** 모바일 행의 ⋯ — 바텀시트를 연다 */
  onOpenSheet: (trip: Trip) => void;
  /** PC 카드 · 행의 ⋯ 드롭다운 */
  pcActions: (trip: Trip) => ReactNode;
  onCreate: () => void;
};

/** 내 여행 묶음(다가오는 · 지난) — 모바일은 행, PC 는 다가오는 여행 카드 3열 · 지난 여행 2열 */
export function TripGroups({ groups, today, onOpenSheet, pcActions, onCreate }: TripGroupsProps) {
  return (
    <>
      {groups.map((group) => (
        <section key={group.kind} className="pt-6 lg:pt-0">
          <h2 className="px-5 pb-1.5 text-[17px] font-extrabold text-ink-900 lg:px-0 lg:pb-3.5 lg:text-lg">
            {group.title}
          </h2>

          <div className="lg:hidden">
            {group.trips.map((trip) => (
              <TripRow
                key={trip.id}
                trip={trip}
                today={today}
                companionCount={trip.companionCount}
                actions={
                  <IconButton
                    label={`${trip.title} 메뉴`}
                    onClick={() => onOpenSheet(trip)}
                    className="-m-2 p-2 text-ink-700"
                  >
                    <Ellipsis className="size-5.5" />
                  </IconButton>
                }
              />
            ))}
          </div>

          {group.kind === "upcoming" ? (
            <div className="hidden grid-cols-3 gap-5 lg:grid">
              {group.trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  today={today}
                  companionCount={trip.companionCount}
                  actions={pcActions(trip)}
                />
              ))}
              <CreateTripTile onClick={onCreate} />
            </div>
          ) : (
            <div className="hidden grid-cols-2 gap-x-8 lg:grid">
              {group.trips.map((trip) => (
                <TripRowCompact
                  key={trip.id}
                  trip={trip}
                  companionCount={trip.companionCount}
                  actions={pcActions(trip)}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  );
}
