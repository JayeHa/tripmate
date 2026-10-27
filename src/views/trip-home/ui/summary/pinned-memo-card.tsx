import { Star } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { Peek } from "../../lib/peek";
import type { PinnedMemo } from "../../lib/pinned-memos";
import { BoardCard } from "./board-card";
import type { BoardCardItem } from "./board-grid";

type Layout = "mobile" | "pc";

type MemoTileProps = { memo: PinnedMemo; onPeek: (peek: Peek) => void };

/** 메모 한 칸 — 어느 일정의 메모인지(+ ★ 중요) · 글. ★ 중요는 노란 칸, 아니면 일정 화면의 메모처럼 회색 칸 */
function MemoTile({ memo, onPeek }: MemoTileProps) {
  return (
    <button
      type="button"
      onClick={() => onPeek(memo.peek)}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-1 rounded-memo px-3.5 py-3 text-left",
        memo.starred ? "bg-important-bg" : "bg-surface-memo",
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5 text-xs">
        {memo.starred && (
          <span className="flex shrink-0 items-center gap-0.5 font-extrabold text-important-text">
            <Star className="size-3 fill-current" aria-hidden="true" />
            중요
          </span>
        )}
        <span className="truncate font-semibold text-ink-400">{memo.where}</span>
      </span>
      <span className="text-sm/normal wrap-break-word whitespace-pre-line text-ink-900">
        {memo.body}
      </span>
    </button>
  );
}

/**
 * 고정한 메모 카드 — 여행 전 · 중 · 후 상태판 모두의 맨 아래. 고정한 메모가 없으면(또는 아직 읽는 중이면) 카드가 없다.
 * PC 는 두 열 아래에 전체 폭으로 놓고 메모를 2열로 — 한 열에 쌓으면 오른쪽 열만 길어지고, 전체 폭 한 줄은 글줄이 너무 길다
 */
export function pinnedMemoCards(
  memos: PinnedMemo[] | null,
  layout: Layout,
  onPeek: (peek: Peek) => void,
): BoardCardItem[] {
  if (!memos?.length) return [];
  const node = (
    <BoardCard title="고정한 메모" layout={layout}>
      <ul
        className={cn("gap-2", layout === "pc" ? "grid grid-cols-2 items-start" : "flex flex-col")}
      >
        {memos.map((m) => (
          <li key={m.id}>
            <MemoTile memo={m} onPeek={onPeek} />
          </li>
        ))}
      </ul>
    </BoardCard>
  );
  return [{ key: "pinned-memo", node, wide: true }];
}
