"use client";

import { useRouter } from "next/navigation";
import { TripCreateFlow, useTripCreate } from "@/features/trip/create";

/**
 * 새 여행 만들기 (/trips/new). 모바일은 전체 화면(5b·5c).
 * PC 는 목록에서 모달로 열지만, 주소로 바로 들어오면 같은 모달 모양을 가운데에 그린다.
 */
export function TripCreateView() {
  const router = useRouter();
  const close = () => router.push("/trips");
  // 목록으로 돌아가 새 여행을 강조한다 (시안 5c 완료 → 하이라이트)
  // 두 레이아웃이 상태를 함께 쓴다. 창 크기가 1024px 을 넘나들어도 고른 것이 이어진다
  const state = useTripCreate((tripId) => router.replace(`/trips?created=${tripId}`));

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex h-dvh flex-col lg:hidden">
        <TripCreateFlow layout="mobile" state={state} onClose={close} />
      </div>
      <div className="hidden min-h-dvh items-center justify-center bg-surface-sunken lg:flex">
        <div className="h-[660px] w-[760px] overflow-hidden rounded-sheet bg-white shadow-sheet">
          <TripCreateFlow layout="pc" state={state} onClose={close} />
        </div>
      </div>
    </main>
  );
}
