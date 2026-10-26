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
import { NAV } from "@/shared/lib/nav-transition";
import { useHydrated } from "@/shared/lib/use-hydrated";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { LinkPending } from "@/shared/ui/link-pending";
import { Wordmark } from "@/shared/ui/wordmark";

import { useNavCoach } from "../model/use-nav-coach";
import { InviteDialog } from "./invite-dialog";
import { NavCoach } from "./nav-coach";

type PcHeaderProps = { tripId: string };

/**
 * PC(lg 이상) 여행 화면 공용 헤더. 높이 64, 하단 1px 구분선. 스크롤해도 위에 붙어 있다.
 * 로고 → 내 여행 · 구분선 · 탭 5개(17px, 고른 탭은 3px 밑줄) · 여행 칩 → 내 여행(다른 여행 선택) · 아바타 → 계정 메뉴 · 「+ 일행초대」.
 * 공유 아이콘은 일행초대와 겹쳐 시안에서 뺐다. 화면마다 헤더를 따로 만들지 않는다.
 * 여행 홈에서는 처음 한 번 메뉴 안내(`NavCoach`)를 띄운다.
 *
 * 여행(`useTrip`)은 하이드레이션이 끝난 뒤에 쓴다. 기기에 남긴 쿼리 캐시가 되살아난 뒤 헤더가 하이드레이션되면
 * 서버 HTML(여행 없음)과 첫 렌더(여행 있음)가 어긋나기 때문이다.
 */
export function PcHeader({ tripId }: PcHeaderProps) {
  const pathname = usePathname();
  const day = useSearchParams().get("day");
  const hydrated = useHydrated();
  const { data: cachedTrip } = useTrip(tripId);
  const trip = hydrated ? cachedTrip : undefined;
  const { data: profile } = useMyProfile();
  const [inviteOpen, setInviteOpen] = useState(false);
  const active = activeTripTab(pathname, tripId);
  const coach = useNavCoach(active === "home");

  return (
    <header
      className={cn(
        "sticky top-(--offline-band) z-30 hidden h-16 shrink-0 items-center gap-7 border-b border-divider bg-white px-7 [view-transition-name:pc-header] lg:flex",
        // 안내의 어두운 막이 오프라인 띠 · 화면 위를 덮게
        coach.open && "z-60",
      )}
    >
      <Link href="/trips" title="내 여행 목록" transitionTypes={NAV.back}>
        <Wordmark className="text-[22px]" />
      </Link>
      <span aria-hidden className="h-6 w-px bg-line" />
      <nav className="relative flex gap-8 self-stretch">
        {TRIP_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tripTabHref(tripId, tab, day)}
            transitionTypes={NAV.tab}
            aria-current={tab.key === active ? "page" : undefined}
            className="-mb-px flex"
          >
            <LinkPending>
              {(pending) => (
                // 화면을 기다리는 동안 누른 탭이 먼저 진해지고 깜빡인다
                <span
                  className={cn(
                    "flex items-center border-b-3 text-[17px] whitespace-nowrap",
                    tab.key === active
                      ? "border-ink-900 font-extrabold text-ink-900"
                      : "border-transparent font-bold text-nav-idle",
                    pending && "animate-pulse text-ink-900",
                  )}
                >
                  {tab.label}
                </span>
              )}
            </LinkPending>
          </Link>
        ))}
        {coach.open && <NavCoach onDismiss={coach.dismiss} />}
      </nav>
      <div className="flex-1" />
      {trip && (
        <Link
          href="/trips"
          title="다른 여행 선택"
          transitionTypes={NAV.back}
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
        <Button variant="brand" size="pill" onClick={() => setInviteOpen(true)} disabled={!trip}>
          + 일행초대
        </Button>
      </div>
      {trip && <InviteDialog trip={trip} open={inviteOpen} onOpenChange={setInviteOpen} />}
    </header>
  );
}
