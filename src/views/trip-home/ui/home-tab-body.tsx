import { Hammer } from "lucide-react";

import type { Trip } from "@/entities/trip";
import { EmptyState } from "@/shared/ui/empty-state";

import { isGuideTab } from "../lib/guide";
import { HOME_TAB_LABEL, type HomeTab } from "../lib/home-tabs";
import { GuideTab } from "./guide/guide-tab";
import { SummaryTab } from "./summary/summary-tab";

type HomeTabBodyProps = {
  tripId: string;
  trip: Trip;
  tab: HomeTab;
  layout: "mobile" | "pc";
};

/**
 * 홈 탭 내용. 요약은 시점별 상태판, 가이드(관광지 · 식당 · 쇼핑 · 휴식)는 여행 보관함, 교통은 아직이라 「준비 중」 을 보인다.
 * 가이드는 탭마다 key 로 새로 그린다 — 15장씩 늘린 양 · 연 상세가 다른 탭으로 넘어가지 않게
 */
export function HomeTabBody({ tripId, trip, tab, layout }: HomeTabBodyProps) {
  return (
    <section role="tabpanel" aria-label={HOME_TAB_LABEL[tab]} className="flex flex-1 flex-col">
      {tab === "summary" && <SummaryTab tripId={tripId} trip={trip} layout={layout} />}
      {isGuideTab(tab) && <GuideTab key={tab} tripId={tripId} tab={tab} />}
      {tab === "transport" && (
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
