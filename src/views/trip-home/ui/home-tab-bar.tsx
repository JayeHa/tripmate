import { cn } from "@/shared/lib/utils";

import { HOME_TAB_LABEL, HOME_TABS, type HomeTab } from "../lib/home-tabs";

type HomeTabBarProps = {
  tab: HomeTab;
  /** 없으면 누를 수 없는 탭(로딩 뼈대) */
  onSelect?: (tab: HomeTab) => void;
  variant: "mobile" | "pc";
};

/**
 * 모바일은 넘치면 가로 스크롤 · 높이 46, PC 는 1080 폭 가운데 · 높이 50.
 * 고른 탭의 밑줄이 머리의 아래 선(1px)을 덮는다. 모바일은 스크롤 칸이 세로로도 잘라 탭을 1px 내릴 수 없어서
 * 아래 선을 칸 안쪽 그림자로 그린다(자식의 밑줄이 그 위에 그려진다). PC 는 머리 바깥 선 위로 탭을 1px 내린다
 */
const BAR = {
  mobile:
    "flex scrollbar-none gap-1 overflow-x-auto px-3 shadow-[inset_0_-1px_0_var(--color-divider)]",
  pc: "mx-auto mt-3.5 flex max-w-270 gap-1.5 px-7.5",
};
const ITEM = { mobile: "h-11.5 px-2.5", pc: "-mb-px h-12.5 px-3" };

/**
 * 흰 머리 아래 홈 탭 줄 — 글자 16, 고른 탭은 800 진한 글자 + 진한 밑줄 3px, 나머지는 600 회색
 */
export function HomeTabBar({ tab, onSelect, variant }: HomeTabBarProps) {
  return (
    <div role="tablist" aria-label="여행 홈 탭" className={BAR[variant]}>
      {HOME_TABS.map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={t === tab}
          onClick={onSelect && (() => onSelect(t))}
          className={cn(
            "flex shrink-0 cursor-pointer items-center border-b-3 text-base whitespace-nowrap",
            ITEM[variant],
            t === tab
              ? "border-ink-900 font-extrabold text-ink-900"
              : "border-transparent font-semibold text-ink-400",
          )}
        >
          {HOME_TAB_LABEL[t]}
        </button>
      ))}
    </div>
  );
}
