import { List } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { FLOAT_SHADOW } from "@/shared/ui/filter-select-parts";

type GuideMapTopBarProps = {
  /** 띄운 필터 줄(GuideFilterRow floating) */
  children: React.ReactNode;
  /** 「목록」 — 카드 목록 보기로 */
  onList: () => void;
};

/**
 * 지도 위 맨 윗줄 — 왼쪽은 필터 칩(넘치면 가로로 민다), 오른쪽 끝에 「목록」. 지도 그림 위에 흰 칩으로 띄운다(네이버 지도처럼).
 * 칩 줄(그림자 여백 포함)은 손가락을 받고, 「목록」 옆 빈 곳만 지도로 넘긴다. 가로 스크롤 칸을 pointer-events: none 으로 두고
 * 칩만 받게 했더니 iPhone Safari 에서 칩 위를 밀어도 줄이 밀리지 않았다.
 * PC 는 왼쪽 패널(16 + 380 + 16) 오른쪽부터.
 * 지도 시트를 펼치면 시트가 이 줄을 덮는다
 */
export function GuideMapTopBar({ children, onList }: GuideMapTopBarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-1.5 pr-4 lg:left-103">
      {/* 칩이 「목록」 앞에서 잘리지 않고 흐려지며 사라지게 오른쪽 끝 20px 을 투명하게 */}
      <div className="min-w-0 flex-1 mask-[linear-gradient(to_right,#000_calc(100%-20px),transparent)] *:pointer-events-auto">
        {children}
      </div>
      <button
        type="button"
        onClick={onList}
        className={cn(
          "pointer-events-auto flex h-8.5 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-white px-3 text-[13px] font-bold text-ink-700",
          FLOAT_SHADOW,
        )}
      >
        <List className="size-3.5" aria-hidden="true" />
        목록
      </button>
    </div>
  );
}
