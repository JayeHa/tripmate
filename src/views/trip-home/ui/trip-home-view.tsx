"use client";

/**
 * 여행 홈. 파란 히어로와 홈 탭(메인·관광지·식당·쇼핑·휴식·교통)은 아직이다.
 * 라우트 구조를 먼저 맞추려고 자리만 잡아 둔다.
 */
export function TripHomeView() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-5 text-center">
      <p className="text-[17px] font-bold text-ink-900">여행 홈은 준비 중이에요</p>
      <p className="text-sm text-ink-400">일정 탭에서 여행을 확인할 수 있어요.</p>
    </main>
  );
}
