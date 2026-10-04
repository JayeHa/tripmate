"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useMyProfile } from "@/entities/session";
import { useTrip } from "@/entities/trip";
import { AccountMenu } from "@/features/account-menu";
import { activeTripTab, TRIP_TABS, tripTabHref } from "@/shared/config/trip-tabs";
import { shortRangeLabel } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Wordmark } from "@/shared/ui/wordmark";

import { InviteDialog } from "./invite-dialog";

type PcHeaderProps = { tripId: string };

/**
 * PC(lg 이상) 여행 화면 공용 헤더 (README 17). 높이 64, 하단 1px 구분선. 스크롤해도 위에 붙어 있다.
 * 로고 → 내 여행 · 탭 5개 · 여행 칩 → 내 여행(다른 여행 선택) · 아바타 → 계정 메뉴 · 「+ 일행초대」.
 * 공유 아이콘은 일행초대와 겹쳐 시안에서 뺐다. 화면마다 헤더를 따로 만들지 않는다.
 */
export function PcHeader({ tripId }: PcHeaderProps) {
  const pathname = usePathname();
  const day = useSearchParams().get("day");
  const { data: trip } = useTrip(tripId);
  const { data: profile } = useMyProfile();
  const [inviteOpen, setInviteOpen] = useState(false);
  const active = activeTripTab(pathname, tripId);

  return (
    <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center gap-10 border-b border-divider bg-white px-7 lg:flex">
      <Link href="/trips" title="내 여행 목록">
        <Wordmark className="text-[22px]" />
      </Link>
      <nav className="flex gap-7 self-stretch">
        {TRIP_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tripTabHref(tripId, tab, day)}
            aria-current={tab.key === active ? "page" : undefined}
            className={cn(
              "-mb-px flex items-center border-b-2 text-[15px] whitespace-nowrap",
              tab.key === active
                ? "border-ink-900 font-extrabold text-ink-900"
                : "border-transparent font-semibold text-ink-400",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1" />
      {trip && (
        <Link
          href="/trips"
          title="다른 여행 선택"
          className="flex h-9 items-center gap-1.5 rounded-full bg-surface-muted pr-3 pl-3.5 text-sm font-bold whitespace-nowrap text-ink-900"
        >
          {trip.title}
          <span className="font-medium text-ink-400">
            {shortRangeLabel(trip.start_date, trip.end_date)}
          </span>
          <ChevronDown className="size-4 text-ink-400" />
        </Link>
      )}
      <div className="flex items-center gap-3.5">
        <AccountMenu profile={profile} showName={false} />
        <Button size="pill" onClick={() => setInviteOpen(true)} disabled={!trip}>
          + 일행초대
        </Button>
      </div>
      {/* 열 때만 마운트한다. 닫혀 있어도 마운트되면 멤버 목록을 미리 불러온다 */}
      {trip && inviteOpen && <InviteDialog trip={trip} open onOpenChange={setInviteOpen} />}
    </header>
  );
}
