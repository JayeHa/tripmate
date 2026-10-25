import { AppHeader } from "@/shared/ui/app-header";
import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

/** 줄 자리 표시용 이름 — 개수만 뜻이 있다(배열 index 를 key 로 쓰지 않게) */
const ROWS = ["a", "b", "c", "d"] as const;

/**
 * 가계부 로딩 뼈대 — 서버 응답을 기다리는 동안(`loading.tsx`). 모바일은 탭 · 요약 카드 · 비용 줄,
 * PC 는 날짜 레일 · 표 · 오른쪽 칸. 서버에서 그려 화면 폭을 모르므로 CSS 로 하나만 보인다
 */
export function ExpenseListSkeleton() {
  return (
    <>
      <div className="flex flex-col lg:hidden">
        <AppHeader title="가계부" back="/trips" />
        <SkeletonScreen className="flex flex-col">
          <div className="flex h-11 items-center gap-5.5 border-b border-surface-muted px-5">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="mx-5 mt-4 h-40 rounded-card" />
          <div className="mt-6 flex flex-col divide-y divide-divider border-y border-divider">
            {ROWS.map((k) => (
              <ExpenseRowBone key={k} />
            ))}
          </div>
        </SkeletonScreen>
      </div>
      <SkeletonScreen className="hidden h-[calc(100dvh-var(--shell-top))] lg:flex">
        <div className="flex w-50 shrink-0 flex-col gap-2 border-r border-divider px-3 py-5">
          {ROWS.map((k) => (
            <Skeleton key={k} className="h-10 rounded-button" />
          ))}
        </div>
        <div className="flex min-w-0 flex-1 gap-2.5 px-6 py-5.5">
          <div className="flex min-w-0 flex-1 flex-col gap-3.5">
            <h1 className="text-[22px] font-extrabold text-ink-900">가계부</h1>
            <Skeleton className="h-9 w-2/3 rounded-button" />
            <div className="flex flex-col divide-y divide-divider rounded-card border border-line-card">
              {ROWS.map((k) => (
                <ExpenseRowBone key={k} />
              ))}
            </div>
          </div>
          <Skeleton className="w-90 shrink-0 rounded-card" />
        </div>
      </SkeletonScreen>
    </>
  );
}

/** 비용 한 줄 — 카테고리 원 · 이름 · 금액 */
function ExpenseRowBone() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
