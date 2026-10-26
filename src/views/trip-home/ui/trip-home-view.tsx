"use client";

import { useTrip } from "@/entities/trip";
import { useMediaQuery } from "@/shared/lib/use-media-query";

import { useHomeTab } from "../model/use-home-tab";
import { HomeSkeleton } from "./home-skeleton";
import { MobileHome } from "./mobile-home";
import { PcHome } from "./pc-home";

type TripHomeViewProps = { tripId: string };

/**
 * 여행 홈 — 흰 머리 + 홈 탭(요약 · 관광지 · 식당 · 쇼핑 · 휴식 · 교통). 지금 탭은 주소(?tab=)에 둔다.
 * 첫 렌더(하이드레이션)에서는 화면 폭을 몰라 뼈대를 그린다 — 기기에 남긴 여행 캐시로 그리면 서버 HTML 과 어긋나는 것도 이걸로 피한다
 */
export function TripHomeView({ tripId }: TripHomeViewProps) {
  const { tab, setTab } = useHomeTab();
  const { data: trip } = useTrip(tripId);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  if (isDesktop === null || !trip) return <HomeSkeleton />;
  return isDesktop ? (
    <PcHome tripId={tripId} trip={trip} tab={tab} onTab={setTab} />
  ) : (
    <MobileHome tripId={tripId} trip={trip} tab={tab} onTab={setTab} />
  );
}
