import type * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

type Layout = "mobile" | "pc";

/**
 * 상태판 카드 한 장과 그 key. pinLeft 면 PC 에서 번갈아 놓지 않고 왼쪽 열 맨 위(정산 띠),
 * wide 면 두 열 아래에 전체 폭(고정한 항목)
 */
export type BoardCardItem = {
  key: string;
  node: React.ReactNode;
  pinLeft?: boolean;
  wide?: boolean;
};

type BoardGridProps = { cards: BoardCardItem[]; layout: Layout };

/**
 * 카드 배치 — 모바일은 한 줄로 이어 붙이고, PC 는 두 열(1.15 : 1)에 순서대로 왼쪽 · 오른쪽 번갈아 놓는다.
 * pinLeft 카드는 번갈아 세지 않고 왼쪽 열 맨 위, wide 카드는 두 열 아래에 전체 폭(모바일은 순서대로 맨 아래에 둔다)
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
  const pinned = cards.filter((c) => c.pinLeft);
  const wide = cards.filter((c) => c.wide);
  const rest = cards.filter((c) => !c.pinLeft && !c.wide);
  const cols = [
    [...pinned, ...rest.filter((_, i) => i % 2 === 0)],
    rest.filter((_, i) => i % 2 === 1),
  ];
  return (
    <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-x-5 gap-y-4 px-10 pt-1">
      {cols.map((col) => (
        <div key={col[0]?.key ?? "empty"} className="flex min-w-0 flex-col gap-4">
          {col.map((c) => (
            <div key={c.key}>{c.node}</div>
          ))}
        </div>
      ))}
      {wide.map((c) => (
        <div key={c.key} className="col-span-2 min-w-0">
          {c.node}
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
