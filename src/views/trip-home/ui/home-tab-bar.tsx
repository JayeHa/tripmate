import { cn } from "@/shared/lib/utils";

import { HOME_TAB_LABEL, HOME_TABS, type HomeTab } from "../lib/home-tabs";

type HomeTabBarProps = {
  tab: HomeTab;
  /** 없으면 누를 수 없는 탭(로딩 뼈대) */
  onSelect?: (tab: HomeTab) => void;
  variant: "mobile" | "pc";
};

/** 모바일은 넘치면 가로 스크롤 · 높이 50, PC 는 1080 폭 가운데 · 위 구분선 · 높이 52 */
const BAR = {
  mobile: "flex scrollbar-none gap-1 overflow-x-auto px-3",
  pc: "mx-auto mt-4.5 flex max-w-270 gap-1.5 border-t border-white/28 px-7.5",
};
const ITEM = { mobile: "h-12.5 px-2.5", pc: "h-13 px-3" };

/**
 * 파란 히어로 아래 홈 탭 줄 — 흰 글자 16, 고른 탭은 800 + 흰 밑줄 3px, 나머지는 600
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
            t === tab ? "border-white font-extrabold" : "border-transparent font-semibold",
          )}
        >
          {HOME_TAB_LABEL[t]}
        </button>
      ))}
    </div>
  );
}
