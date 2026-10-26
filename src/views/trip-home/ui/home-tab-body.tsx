import { Hammer } from "lucide-react";

import { EmptyState } from "@/shared/ui/empty-state";

import { HOME_TAB_LABEL, type HomeTab } from "../lib/home-tabs";

type HomeTabBodyProps = { tab: HomeTab };

/**
 * 홈 탭 내용. 메인(고정한 체크리스트 · 바우처) · 가이드(관광지 · 식당 · 쇼핑 · 휴식) · 교통은 아직이라
 * 모든 탭이 「준비 중」 을 보인다 — 탭마다 내용을 만들 때 여기서 나눈다
 */
export function HomeTabBody({ tab }: HomeTabBodyProps) {
  return (
    <section
      role="tabpanel"
      aria-label={HOME_TAB_LABEL[tab]}
      className="flex flex-1 flex-col justify-center"
    >
      <EmptyState
        icon={Hammer}
        title="아직 준비 중이에요"
        description="곧 이 탭에서 여행 정보를 볼 수 있어요"
      />
    </section>
  );
}
