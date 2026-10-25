import { PageTransition } from "@/shared/ui/page-transition";
import { ScheduleSkeleton } from "@/views/trip-schedule";

/**
 * 일정 화면을 서버에서 받는 동안 — 0.3초 넘게 걸리면 뼈대를 보인다.
 * `(timeline)` 묶음에 두어 하위 화면(전체 화면 지도)에는 이 뼈대가 뜨지 않게 한다 — loading 은 아래 화면을 모두 감싼다
 */
export default function Loading() {
  return (
    <PageTransition>
      <ScheduleSkeleton />
    </PageTransition>
  );
}
