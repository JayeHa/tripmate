import { AppHeader } from "@/shared/ui/app-header";
import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

/** 카드 자리 표시용 이름 — 개수만 뜻이 있다(배열 index 를 key 로 쓰지 않게) */
const CARDS = ["a", "b", "c"] as const;
const DAYS = ["a", "b", "c", "d"] as const;

/**
 * 일정 화면 로딩 뼈대 — 서버 응답을 기다리는 동안(`loading.tsx`). 모바일은 지도 · 날짜 칩 · 카드,
 * PC 는 날짜 레일 · 목록 · 지도 3칸. 서버에서 그려 화면 폭을 모르므로 CSS 로 하나만 보인다
 */
export function ScheduleSkeleton() {
  return (
    <>
      <div className="flex flex-col lg:hidden">
        <AppHeader title="" back="/trips" />
        <SkeletonScreen className="flex flex-col">
          <div className="flex flex-col gap-2 px-5 pt-1.5 pb-5.5">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-47.5 animate-none rounded-none" />
          <div className="flex gap-1.5 px-5 py-3">
            {CARDS.map((k) => (
              <Skeleton key={k} className="h-8 w-16 rounded-full" />
            ))}
          </div>
          <TimelineBones />
        </SkeletonScreen>
      </div>
      <SkeletonScreen className="hidden h-[calc(100dvh-var(--shell-top))] lg:flex">
        <div className="flex w-58 shrink-0 flex-col gap-3 border-r border-divider px-5 pt-5">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex flex-col gap-2 pt-4">
            {DAYS.map((k) => (
              <Skeleton key={k} className="h-10 rounded-button" />
            ))}
          </div>
        </div>
        <div className="w-110 shrink-0">
          <TimelineBones />
        </div>
        <Skeleton className="min-w-80 flex-1 animate-none rounded-none" />
      </SkeletonScreen>
    </>
  );
}

/** 날짜 제목과 타임라인 카드 셋 — 번호 원 + 카드(제목 · 두 줄) */
function TimelineBones() {
  return (
    <div className="flex flex-col gap-3.5 px-5 pt-4.5">
      <Skeleton className="h-5 w-2/5" />
      {CARDS.map((k) => (
        <div key={k} className="flex gap-3.5">
          <Skeleton className="size-6.5 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 rounded-card border border-line-card px-4 py-3.5">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-[85%]" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
