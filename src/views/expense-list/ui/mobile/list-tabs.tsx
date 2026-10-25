import Link from "next/link";

import { NAV } from "@/shared/lib/nav-transition";
import { cn } from "@/shared/lib/utils";

type ListTabsProps = {
  active: "list" | "stats";
  /** 「내역」 · 「지출 · 정산」 탭이 갈 곳 */
  listHref: string;
  statsHref: string;
};

/**
 * 가계부 머리 아래 탭 「내역 | 지출 · 정산」 — 42 높이, 고른 탭은 16/800 잉크 + 밑줄 2.5, 아닌 탭은 16/600 회색.
 * 머리 바로 아래에 붙어(sticky) 스크롤해도 보인다. 탭마다 주소가 따로라 뒤로 가기로 앞 탭에 돌아온다
 */
export function ListTabs({ active, listHref, statsHref }: ListTabsProps) {
  return (
    <nav className="sticky top-[calc(var(--shell-top)+3.25rem)] z-20 flex gap-5.5 border-b border-surface-muted bg-white px-5">
      <Tab href={listHref} on={active === "list"}>
        내역
      </Tab>
      <Tab href={statsHref} on={active === "stats"}>
        지출 · 정산
      </Tab>
    </nav>
  );
}

type TabProps = { href: string; on: boolean; children: string };

/** 탭 하나 — 고른 탭은 링크가 아니라 지금 위치 */
function Tab({ href, on, children }: TabProps) {
  if (on) {
    return (
      <span aria-current="page" className={cn(TAB, "border-ink-900 font-extrabold text-ink-900")}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      transitionTypes={NAV.tab}
      className={cn(TAB, "border-transparent font-semibold text-ink-350")}
    >
      {children}
    </Link>
  );
}

const TAB = "flex h-10.5 items-center border-b-[2.5px] text-base";
