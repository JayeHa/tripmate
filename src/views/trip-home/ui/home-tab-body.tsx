import { Hammer } from "lucide-react";

import type { Trip } from "@/entities/trip";
import { EmptyState } from "@/shared/ui/empty-state";

import { HOME_TAB_LABEL, type HomeTab } from "../lib/home-tabs";
import { SummaryTab } from "./summary/summary-tab";

type HomeTabBodyProps = {
  tripId: string;
  trip: Trip;
  tab: HomeTab;
  layout: "mobile" | "pc";
};

/**
 * 홈 탭 내용. 요약은 시점별 상태판, 가이드(관광지 · 식당 · 쇼핑 · 휴식) · 교통은 아직이라 「준비 중」 을 보인다
 */
export function HomeTabBody({ tripId, trip, tab, layout }: HomeTabBodyProps) {
  return (
    <section role="tabpanel" aria-label={HOME_TAB_LABEL[tab]} className="flex flex-1 flex-col">
      {tab === "summary" ? (
        <SummaryTab tripId={tripId} trip={trip} layout={layout} />
      ) : (
        <EmptyState
          icon={Hammer}
          title="아직 준비 중이에요"
          description="곧 이 탭에서 여행 정보를 볼 수 있어요"
          className="my-auto"
        />
      )}
    </section>
  );
}
