import { Suspense } from "react";

import { BottomNav } from "@/widgets/bottom-nav";
import { PcHeader } from "@/widgets/pc-header";
import { TripShell } from "@/widgets/trip-shell";

export default async function TripLayout({ children, params }: LayoutProps<"/trips/[tripId]">) {
  const { tripId } = await params;
  return (
    // --shell-top: 화면 위에 sticky 로 붙은 셸 높이. 모바일은 없음, PC 는 PcHeader 64px.
    // sticky 요소들은 이 값 아래에 붙는다(AppHeader, 일정 지도 등)
    <div className="flex min-h-full flex-1 flex-col pb-16 [--shell-top:0px] lg:pb-0 lg:[--shell-top:4rem]">
      {/* 탭: PC 는 상단 헤더, 모바일은 하단 탭. 둘 다 검색 파라미터(day)를 읽어 Suspense 로 감싼다 */}
      <Suspense>
        <PcHeader tripId={tripId} />
      </Suspense>
      <TripShell tripId={tripId}>{children}</TripShell>
      <div className="lg:hidden">
        <Suspense>
          <BottomNav tripId={tripId} />
        </Suspense>
      </div>
    </div>
  );
}
