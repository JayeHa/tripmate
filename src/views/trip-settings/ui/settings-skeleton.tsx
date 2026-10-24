import { AppHeader } from "@/shared/ui/app-header";
import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

/**
 * 여행 설정 로딩 뼈대 — 서버 응답을 기다리는 동안(`loading.tsx`). 초대 링크 · 멤버 · 여행 정보 카드 자리.
 * 모바일 · PC 가 같은 배치다
 */
export function SettingsSkeleton() {
  return (
    <>
      <AppHeader title="여행 설정" back="/trips" />
      <SkeletonScreen className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-72 rounded-card" />
      </SkeletonScreen>
    </>
  );
}
