import type { Trip } from "@/entities/trip";

import { isGuideTab } from "../lib/guide";
import { HOME_TAB_LABEL, type HomeTab } from "../lib/home-tabs";
import { GuideTab } from "./guide/guide-tab";
import { SummaryTab } from "./summary/summary-tab";
import { TransportTab } from "./transport/transport-tab";

type HomeTabBodyProps = {
  tripId: string;
  trip: Trip;
  tab: HomeTab;
  layout: "mobile" | "pc";
};

/**
 * 홈 탭 내용. 요약은 시점별 상태판, 가이드(관광지 · 식당 · 쇼핑 · 휴식)는 여행 보관함, 교통은 1인 예상 교통비.
 * 가이드는 탭마다 key 로 새로 그린다 — 15장씩 늘린 양 · 연 상세가 다른 탭으로 넘어가지 않게
 */
export function HomeTabBody({ tripId, trip, tab, layout }: HomeTabBodyProps) {
  return (
    <section
      role="tabpanel"
      aria-label={HOME_TAB_LABEL[tab]}
      className="flex min-h-0 flex-1 flex-col"
    >
      {tab === "summary" && <SummaryTab tripId={tripId} trip={trip} layout={layout} />}
      {isGuideTab(tab) && <GuideTab key={tab} trip={trip} tab={tab} layout={layout} />}
      {tab === "transport" && <TransportTab tripId={tripId} trip={trip} layout={layout} />}
    </section>
  );
}
