"use client";

import { CalendarDays, Map, Receipt, Scale, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "itinerary", label: "일정", icon: CalendarDays, keepDay: true },
  { href: "map", label: "지도", icon: Map, keepDay: true },
  { href: "expenses", label: "가계부", icon: Receipt },
  { href: "settlement", label: "정산", icon: Scale },
  { href: "settings", label: "설정", icon: Settings },
] as const;

export function BottomNav({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const day = searchParams.get("day");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const base = `/trips/${tripId}/${tab.href}`;
          const active = pathname.startsWith(base);
          const href = "keepDay" in tab && tab.keepDay && day ? `${base}?day=${day}` : base;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px]",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <tab.icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
