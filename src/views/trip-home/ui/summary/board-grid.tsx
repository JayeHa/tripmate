import type * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

type Layout = "mobile" | "pc";

/** 상태판 카드 한 장과 그 key */
export type BoardCardItem = { key: string; node: React.ReactNode };

type BoardGridProps = { cards: BoardCardItem[]; layout: Layout };

/**
 * 카드 배치 — 모바일은 한 줄로 이어 붙이고, PC 는 두 열(1.15 : 1)에 순서대로 왼쪽 · 오른쪽 번갈아 놓는다
 */
export function BoardGrid({ cards, layout }: BoardGridProps) {
  if (layout === "mobile")
    return (
      <div className="flex flex-col">
        {cards.map((c) => (
          <div key={c.key}>{c.node}</div>
        ))}
      </div>
    );
  const cols = [cards.filter((_, i) => i % 2 === 0), cards.filter((_, i) => i % 2 === 1)];
  return (
    <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-5 px-10 pt-1">
      {cols.map((col) => (
        <div key={col[0]?.key ?? "empty"} className="flex min-w-0 flex-col gap-4">
          {col.map((c) => (
            <div key={c.key}>{c.node}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

type BoardSkeletonProps = { layout: Layout };

/** 상태판을 읽는 동안 — 카드 두 장 자리 */
export function BoardSkeleton({ layout }: BoardSkeletonProps) {
  return (
    <SkeletonScreen className={cn("flex flex-col gap-4", layout === "pc" ? "px-10 pt-1" : "px-5")}>
      <Skeleton className="h-36 w-full rounded-card" />
      <Skeleton className="h-28 w-full rounded-card" />
    </SkeletonScreen>
  );
}
