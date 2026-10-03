"use client";

/**
 * 노트. 할 일 · 준비물 · 쇼핑 · 바우처 네 탭은 아직이다.
 * 라우트 구조를 먼저 맞추려고 자리만 잡아 둔다.
 */
export function TripNotesView() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-5 text-center">
      <p className="text-[17px] font-bold text-ink-900">노트는 준비 중이에요</p>
      <p className="text-sm text-ink-400">할 일과 준비물, 바우처를 여기서 모아 볼 거예요.</p>
    </main>
  );
}
