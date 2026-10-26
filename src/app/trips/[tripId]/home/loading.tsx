import { PageTransition } from "@/shared/ui/page-transition";
import { HomeSkeleton } from "@/views/trip-home";

/**
 * 여행 홈을 서버에서 받는 동안 — 0.3초 넘게 걸리면 뼈대를 보인다. 여행 목록 카드가 여는 첫 화면이라, 이 파일이 있어야
 * 누르자마자 여행 화면(PC 헤더 · 하단 탭)으로 넘어간다
 */
export default function Loading() {
  return (
    <PageTransition>
      <HomeSkeleton />
    </PageTransition>
  );
}
