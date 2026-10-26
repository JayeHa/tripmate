import type { Viewport } from "next";
import { Suspense } from "react";

import { PageTransition } from "@/shared/ui/page-transition";
import { HomeSkeleton, TripHomeView } from "@/views/trip-home";

export const metadata = { title: "홈" };

// 모바일은 화면 맨 위가 파란 히어로라 브라우저 · 상태 표시줄 색도 맞춘다. PC 는 위가 흰 상단 메뉴라 그대로 흰색
export const viewport: Viewport = {
  themeColor: [{ media: "(max-width: 1023px)", color: "#1f6feb" }, { color: "#ffffff" }],
};

export default async function Page({ params }: PageProps<"/trips/[tripId]/home">) {
  const { tripId } = await params;
  // 탭을 주소(?tab=)에서 읽는다(useSearchParams) — Suspense 로 감싼다
  return (
    <PageTransition>
      <Suspense fallback={<HomeSkeleton />}>
        <TripHomeView tripId={tripId} />
      </Suspense>
    </PageTransition>
  );
}
