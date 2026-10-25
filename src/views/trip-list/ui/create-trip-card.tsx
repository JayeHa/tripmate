import { Plus } from "lucide-react";
import Link from "next/link";

import { NAV } from "@/shared/lib/nav-transition";

/** 모바일 목록 맨 위 「여행 일정 만들기」 카드. /trips/new 전체 화면으로 간다 (PC 는 헤더 줄의 pill 버튼) */
export function CreateTripCard() {
  return (
    <div className="px-5 pt-5 pb-1 lg:hidden">
      <Link
        href="/trips/new"
        transitionTypes={NAV.forward}
        className="flex items-center gap-3.5 rounded-card bg-surface-sunken p-4.5"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary">
          <Plus className="size-6 text-white" strokeWidth={2.4} />
        </span>
        <span className="flex flex-col gap-0.75">
          <span className="text-base font-bold text-ink-900">여행 일정 만들기</span>
          <span className="text-[13px] text-ink-400">도시와 날짜만 고르면 바로 시작돼요</span>
        </span>
      </Link>
    </div>
  );
}

type CreateTripTileProps = { onClick: () => void };

/** PC 다가오는 여행 그리드의 마지막 칸. 누르면 이 화면 위에 만들기 모달을 연다 */
export function CreateTripTile({ onClick }: CreateTripTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-59 flex-col items-center justify-center gap-2.5 rounded-card border-[1.5px] border-dashed border-line-strong bg-surface-sunken"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-primary">
        <Plus className="size-6.5 text-white" strokeWidth={2.4} />
      </span>
      <span className="text-base font-bold text-ink-900">여행 일정 만들기</span>
      <span className="text-[13px] text-ink-400">도시와 날짜만 고르면 바로 시작돼요</span>
    </button>
  );
}
