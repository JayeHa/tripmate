import { ListTodo, type LucideIcon, Star, Ticket } from "lucide-react";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

import type { Peek } from "../../lib/peek";
import type { PinnedMemo } from "../../lib/pinned-memos";
import type { PinnedBoard } from "../../model/use-pinned";
import { BoardCard } from "./board-card";
import type { BoardCardItem } from "./board-grid";

type Layout = "mobile" | "pc";

type OnPeek = (peek: Peek) => void;

type TileProps = {
  peek: Peek;
  onPeek: OnPeek;
  /** 칸 바탕 — ★ 중요 메모는 노랑, 메모는 일정 화면의 메모 색, 할 일 · 바우처는 회색 */
  tone: string;
  /** 윗줄(무엇인지 · 어디의 것인지) */
  head: React.ReactNode;
  children: React.ReactNode;
};

/** 고정한 것 한 칸 — 윗줄 12 · 아래 내용. 누르면 미리 보기 */
function Tile({ peek, onPeek, tone, head, children }: TileProps) {
  return (
    <button
      type="button"
      onClick={() => onPeek(peek)}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-1 rounded-memo px-3.5 py-3 text-left",
        tone,
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5 text-xs">{head}</span>
      {children}
    </button>
  );
}

type KindHeadProps = { icon: LucideIcon; label: string; className?: string };

/** 할 일 · 바우처 칸의 윗줄 — 아이콘 + 「체크리스트 · 10/27(화) · D-3」 */
function KindHead({ icon: Icon, label, className }: KindHeadProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1 font-semibold text-ink-400", className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}

/** 할 일 · 바우처 칸의 제목 */
const TITLE = "text-[15px] font-bold wrap-break-word text-ink-900";

type MemoHeadProps = { memo: PinnedMemo };

/** 메모 칸의 윗줄 — (★ 중요) · 어느 일정의 메모인지 */
function MemoHead({ memo }: MemoHeadProps) {
  return (
    <>
      {memo.starred && (
        <span className="flex shrink-0 items-center gap-0.5 font-extrabold text-important-text">
          <Star className="size-3 fill-current" aria-hidden="true" />
          중요
        </span>
      )}
      <span className="truncate font-semibold text-ink-400">{memo.where}</span>
    </>
  );
}

/** 카드 안의 칸들 — 할 일 → 바우처 → 메모(짧은 것 먼저, 긴 글은 뒤) */
function tilesOf(board: PinnedBoard, onPeek: OnPeek) {
  return [
    ...board.todos.map((t) => ({
      key: `todo-${t.id}`,
      node: (
        <Tile
          peek={t.peek}
          onPeek={onPeek}
          tone="bg-surface-sunken"
          head={
            <KindHead
              icon={ListTodo}
              label={t.label}
              className={cn(t.soon && "text-status-wait-text")}
            />
          }
        >
          <span className={cn(TITLE, t.done && "text-ink-400 line-through")}>{t.title}</span>
        </Tile>
      ),
    })),
    ...board.vouchers.map((v) => ({
      key: `voucher-${v.id}`,
      node: (
        <Tile
          peek={v.peek}
          onPeek={onPeek}
          tone="bg-surface-sunken"
          head={<KindHead icon={Ticket} label={v.label} />}
        >
          <span className={TITLE}>{v.title}</span>
        </Tile>
      ),
    })),
    ...board.memos.map((m) => ({
      key: `memo-${m.id}`,
      node: (
        <Tile
          peek={m.peek}
          onPeek={onPeek}
          tone={m.starred ? "bg-important-bg" : "bg-surface-memo"}
          head={<MemoHead memo={m} />}
        >
          <span className="text-sm/normal wrap-break-word whitespace-pre-line text-ink-900">
            {m.body}
          </span>
        </Tile>
      ),
    })),
  ];
}

/**
 * 고정한 항목 카드 — 「홈에 고정」 한 체크리스트 할 일 · 바우처 · 메모. 여행 전 · 중 · 후 상태판 모두의 맨 아래.
 * 고정한 것이 없으면(또는 아직 읽는 중이면) 카드가 없다.
 * PC 는 두 열 아래에 전체 폭으로 놓고 칸을 2열로 — 한 열에 쌓으면 오른쪽 열만 길어지고, 전체 폭 한 줄은 글줄이 너무 길다
 */
export function pinnedCards(
  board: PinnedBoard | null,
  layout: Layout,
  onPeek: OnPeek,
): BoardCardItem[] {
  const tiles = board ? tilesOf(board, onPeek) : [];
  if (tiles.length === 0) return [];
  const node = (
    <BoardCard title="고정한 항목" layout={layout}>
      <ul
        className={cn("gap-2", layout === "pc" ? "grid grid-cols-2 items-start" : "flex flex-col")}
      >
        {tiles.map((t) => (
          <li key={t.key}>{t.node}</li>
        ))}
      </ul>
    </BoardCard>
  );
  return [{ key: "pinned", node, wide: true }];
}
