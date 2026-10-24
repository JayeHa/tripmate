import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

/** 칸 자리 표시용 이름 — 개수만 뜻이 있다(배열 index 를 key 로 쓰지 않게) */
const TABS = ["checklist", "voucher", "pack", "shopping"] as const;
const ROWS = ["a", "b", "c"] as const;

/**
 * 노트 화면 로딩 뼈대 — 서버 응답을 기다리는 동안(`loading.tsx`). 제목 「노트」 는 그대로 그리고 탭 · 목록만 회색 칸.
 * 모바일은 위 탭 칩, PC 는 왼쪽 세로 메뉴. 서버에서 그려 화면 폭을 모르므로 CSS 로 하나만 보인다
 */
export function NotesSkeleton() {
  return (
    <main className="flex flex-1 flex-col bg-surface-sunken lg:flex-row">
      <header className="flex flex-col bg-white lg:hidden">
        <h1 className="flex h-13 items-center px-5 text-xl font-extrabold tracking-[-0.02em] text-ink-900">
          노트
        </h1>
        <SkeletonScreen className="flex gap-1.5 border-b border-surface-muted px-5 pb-3">
          {TABS.map((k) => (
            <Skeleton key={k} className="h-8.5 w-20 rounded-full" />
          ))}
        </SkeletonScreen>
      </header>
      <nav className="hidden h-[calc(100dvh-var(--shell-top))] w-55 shrink-0 flex-col gap-1 border-r border-divider bg-white px-3 py-5 lg:flex">
        <span className="px-3 pb-2.5 text-[13px] font-bold text-ink-400">노트</span>
        <SkeletonScreen className="flex flex-col gap-1">
          {TABS.map((k) => (
            <Skeleton key={k} className="h-10 rounded-button" />
          ))}
        </SkeletonScreen>
      </nav>
      <SkeletonScreen className="flex flex-col gap-3 p-5 lg:max-w-160 lg:flex-1 lg:p-6">
        <div className="flex h-14 items-center rounded-card border border-line-card bg-white px-4">
          <Skeleton className="h-4 w-1/2" />
        </div>
        {ROWS.map((k) => (
          <div
            key={k}
            className="flex h-15 items-center gap-3 rounded-card border border-line-card bg-white px-4"
          >
            <Skeleton className="size-5.5 shrink-0" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </SkeletonScreen>
    </main>
  );
}
