import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

/**
 * 여행 설정 로딩 뼈대 — 서버 응답을 기다리는 동안(`loading.tsx`)과 여행을 읽기 전.
 * 화면과 같은 배치: 모바일은 머리 + 카드 한 줄, PC 는 제목 + 2열(초대 · 멤버 | 여행 정보)
 */
export function SettingsSkeleton() {
  return (
    <>
      <header className="flex h-13 shrink-0 items-center bg-white px-5 lg:hidden">
        <h1 className="text-lg font-extrabold text-ink-900">여행 설정</h1>
      </header>
      <SkeletonScreen className="flex flex-1 flex-col bg-surface-sunken">
        <div className="flex w-full flex-col gap-3 px-4 pt-3 lg:mx-auto lg:max-w-260 lg:gap-5 lg:px-10 lg:pt-8">
          <h1 className="hidden text-2xl font-extrabold tracking-[-0.02em] text-ink-900 lg:block">
            여행 설정
          </h1>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-5">
            <div className="flex flex-col gap-3 lg:gap-5">
              <Skeleton className="h-50 rounded-card" />
              <Skeleton className="h-40 rounded-card" />
            </div>
            <Skeleton className="h-80 rounded-card" />
          </div>
        </div>
      </SkeletonScreen>
    </>
  );
}
