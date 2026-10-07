import Link from "next/link";

import { cn } from "@/shared/lib/utils";

type ListTabsProps = {
  /** 「지출 · 정산」 탭이 갈 곳 */
  statsHref: string;
};

/**
 * 가계부 머리 아래 탭 「내역 | 지출 · 정산」 — 42 높이, 고른 탭은 16/800 잉크 + 밑줄 2.5.
 * 머리 바로 아래에 붙어(sticky) 스크롤해도 보인다
 */
export function ListTabs({ statsHref }: ListTabsProps) {
  return (
    <nav className="sticky top-[calc(var(--shell-top)+3.25rem)] z-20 flex gap-5.5 border-b border-surface-muted bg-white px-5">
      <span aria-current="page" className={cn(TAB, "border-ink-900 font-extrabold text-ink-900")}>
        내역
      </span>
      <Link href={statsHref} className={cn(TAB, "border-transparent font-semibold text-ink-350")}>
        지출 · 정산
      </Link>
    </nav>
  );
}

const TAB = "flex h-10.5 items-center border-b-[2.5px] text-base";
