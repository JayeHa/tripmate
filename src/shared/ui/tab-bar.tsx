"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { NAV } from "@/shared/lib/nav-transition";
import { cn } from "@/shared/lib/utils";

import { LinkPending } from "./link-pending";

export type TabItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
};

type BottomTabBarProps = { items: TabItem[]; active: string };

/**
 * 여행 안 화면의 하단 탭. 높이 83 + 홈 버튼 줄(safe area), 활성은 파랑이 아니라 잉크(#222).
 * 높이를 바꾸면 여행 레이아웃의 `--tab-bar`(내용 아래 여백)도 함께 바꾼다
 */
export function BottomTabBar({ items, active }: BottomTabBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 h-[calc(83px+env(safe-area-inset-bottom))] border-t border-divider bg-background pt-2 pb-[env(safe-area-inset-bottom)] [view-transition-name:tab-bar]">
      <ul className="mx-auto flex h-18.75 max-w-lg">
        {items.map((tab) => {
          const on = tab.key === active;
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                transitionTypes={NAV.tab}
                aria-current={on ? "page" : undefined}
                className="flex flex-col items-center"
              >
                <LinkPending>
                  {(pending) => (
                    // 화면을 기다리는 동안 누른 탭이 먼저 진해지고 깜빡인다
                    <span
                      className={cn(
                        "flex flex-col items-center gap-1 text-[11px]",
                        on ? "font-bold text-ink-900" : "text-ink-400",
                        pending && "animate-pulse text-ink-900",
                      )}
                    >
                      <tab.icon className="size-6" strokeWidth={on ? 1.9 : 1.6} />
                      {tab.label}
                    </span>
                  )}
                </LinkPending>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
