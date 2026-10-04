"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/utils";

export type TabItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
};

type BottomTabBarProps = { items: TabItem[]; active: string };

/**
 * 여행 안 화면의 하단 탭. 높이 83 고정, 활성은 파랑이 아니라 잉크(#222).
 */
export function BottomTabBar({ items, active }: BottomTabBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 h-[calc(83px+env(safe-area-inset-bottom))] border-t border-divider bg-background pt-2 pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex h-18.75 max-w-lg">
        {items.map((tab) => {
          const on = tab.key === active;
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 text-[11px]",
                  on ? "font-bold text-ink-900" : "text-ink-400",
                )}
              >
                <tab.icon className="size-6" strokeWidth={on ? 1.9 : 1.6} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
