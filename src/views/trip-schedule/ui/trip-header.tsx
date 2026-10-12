"use client";

import { BedDouble, Plane } from "lucide-react";
import { useState } from "react";

import type { Trip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { dateRangeLabel } from "@/shared/lib/days";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { InviteDialog } from "@/widgets/pc-header";

/** 겹쳐 보이는 일행 아바타 수 */
const AVATARS_SHOWN = 3;

type TripHeaderProps = {
  trip: Trip;
  stayCount: number;
  onOpenStays: () => void;
  flightCount: number;
  onOpenFlights: () => void;
};

/**
 * 모바일 일정의 여행 머리(TripHeader) — 제목 26/800 · 날짜 · 여행지, 일행 아바타 40 + 「+ 일행초대」, 아래 칩(항공편 N · 숙소 N).
 * 상단바 아래에서 함께 스크롤되어 올라간다(sticky 지도 위). 체크리스트 · 가계부 칩은 그 화면이 생길 때.
 * 시안의 「연인과 | 치이카와 · 러닝 · 카와고에」 줄은 그런 데이터가 없어 여행지(destination)만 보인다
 */
export function TripHeader({
  trip,
  stayCount,
  onOpenStays,
  flightCount,
  onOpenFlights,
}: TripHeaderProps) {
  const { data: members = [] } = useTripMembers(trip.id);
  const [inviteOpen, setInviteOpen] = useState(false);
  return (
    <div className="flex flex-col bg-white">
      <div className="flex flex-col gap-1.5 px-5 pt-1.5">
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">{trip.title}</h2>
        <span className="text-[15px] text-ink-500">
          {dateRangeLabel(trip.start_date, trip.end_date)}
        </span>
        {trip.destination && <span className="text-[13px] text-ink-450">{trip.destination}</span>}
      </div>
      <div className="flex items-center gap-2 px-5 pt-4.5">
        <div className="flex pl-2.5">
          {members.slice(0, AVATARS_SHOWN).map((m) => (
            <Avatar key={m.user_id} className="-ml-2.5 size-10 ring-2 ring-white">
              {m.profile.avatar_url && <AvatarImage src={m.profile.avatar_url} alt="" />}
              <AvatarFallback>{(m.profile.display_name ?? "?").slice(0, 1)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        {members.length > AVATARS_SHOWN && (
          <span className="text-[13px] font-semibold text-ink-400">
            +{members.length - AVATARS_SHOWN}
          </span>
        )}
        <Button variant="brand" size="pill" onClick={() => setInviteOpen(true)}>
          + 일행초대
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 px-5 pt-3.5 pb-5.5">
        <Button variant="chip" size="chip" onClick={onOpenFlights}>
          <Plane className="size-4" strokeWidth={2} />
          항공편
          {flightCount > 0 && <span className="font-bold text-brand-text">{flightCount}</span>}
        </Button>
        <Button variant="chip" size="chip" onClick={onOpenStays}>
          <BedDouble className="size-4" strokeWidth={2} />
          숙소
          {stayCount > 0 && <span className="font-bold text-brand-text">{stayCount}</span>}
        </Button>
      </div>
      <InviteDialog trip={trip} open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
