import { Suspense } from "react";

import { BottomNav } from "@/widgets/bottom-nav";
import { PcHeader } from "@/widgets/pc-header";
import { TripShell } from "@/widgets/trip-shell";

export default async function TripLayout({ children, params }: LayoutProps<"/trips/[tripId]">) {
  const { tripId } = await params;
  return (
    <div className="flex min-h-full flex-1 flex-col pb-16 lg:pb-0">
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
