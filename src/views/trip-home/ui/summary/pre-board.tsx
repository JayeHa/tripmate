import { ListTodo } from "lucide-react";

import { ExpenseCategoryTile } from "@/entities/expense";
import { NumberMarker, ReservationBadge } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import type { Peek } from "../../lib/peek";
import type { DeadlineRow, DueTone } from "../../lib/pre-board";
import type { PreBoard } from "../../model/use-pre-board";
import { BoardCard, BoardRow } from "./board-card";

type Layout = "mobile" | "pc";

type PrepCardProps = { tripId: string; prep: PreBoard["prep"]; layout: Layout };

/** 여행 준비 — 체크리스트 완료 / 전체 · 진행 막대 · 남은 일 셋(체크리스트 · 예약 필요 · 결제 예정) */
function PrepCard({ tripId, prep, layout }: PrepCardProps) {
  const pct = prep.total ? Math.round((prep.done / prep.total) * 100) : 0;
  const stats = [
    { label: "체크리스트 남음", n: prep.remaining, tone: "text-ink-900" },
    { label: "예약 필요", n: prep.wait, tone: "text-status-wait-text" },
    { label: "결제 예정", n: prep.unpaid, tone: "text-ink-900" },
  ];
  return (
    <BoardCard
      title="여행 준비"
      link={{ label: "노트", href: `/trips/${tripId}/notes` }}
      layout={layout}
    >
      <div className="flex flex-col gap-2">
        <p className="flex items-baseline gap-1.5">
          <span className="text-xl font-extrabold text-ink-900">{prep.done}</span>
          <span className="text-sm font-semibold text-ink-400">/ {prep.total} 준비 완료</span>
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <li
            key={s.label}
            className="flex flex-col gap-0.5 rounded-memo border border-line-card px-3 py-2.5"
          >
            <span className={cn("text-lg font-extrabold", s.tone)}>{s.n}</span>
            <span className="truncate text-xs text-ink-400">{s.label}</span>
          </li>
        ))}
      </ul>
    </BoardCard>
  );
}

/** 마감 줄 오른쪽 글자 색 */
const DUE_TONE: Record<DueTone, string> = {
  over: "text-destructive",
  soon: "text-status-wait-text",
  later: "text-ink-450",
};

/** 마감 임박에 보이는 줄 수 — 나머지는 제목 옆 개수로만 */
const DEADLINE_LIMIT = 5;

type DeadlineLeadProps = { row: DeadlineRow };

/** 마감 줄 왼쪽 칸 — 체크리스트는 회색 할 일 아이콘, 결제는 비용 카테고리 타일 */
function DeadlineLead({ row }: DeadlineLeadProps) {
  if (row.kind === "payment") return <ExpenseCategoryTile category={row.category} />;
  return (
    <span className="flex size-9.5 shrink-0 items-center justify-center rounded-[11px] bg-surface-muted">
      <ListTodo className="size-4.75 text-ink-700" aria-hidden="true" />
    </span>
  );
}

/** 줄을 눌렀을 때 홈 위에 미리 보기를 띄운다 */
type OnPeek = (peek: Peek) => void;

type DeadlineCardProps = { rows: DeadlineRow[]; layout: Layout; onPeek: OnPeek };

/** 마감 임박 — 마감일 있는 안 끝난 할 일 · 결제 예정, 이른 순. 줄을 누르면 미리 보기 */
function DeadlineCard({ rows, layout, onPeek }: DeadlineCardProps) {
  return (
    <BoardCard title="마감 임박" count={String(rows.length)} layout={layout}>
      <ul className="flex flex-col">
        {rows.slice(0, DEADLINE_LIMIT).map((r) => (
          <BoardRow
            key={`${r.kind}-${r.id}`}
            lead={<DeadlineLead row={r} />}
            title={r.title}
            sub={r.kind === "payment" ? "결제 예정" : "체크리스트"}
            onClick={() => onPeek(r.peek)}
            trail={
              <span
                className={cn("shrink-0 text-xs font-bold whitespace-nowrap", DUE_TONE[r.tone])}
              >
                {r.right}
              </span>
            }
          />
        ))}
      </ul>
    </BoardCard>
  );
}

type ReserveCardProps = {
  tripId: string;
  rows: PreBoard["reserves"];
  layout: Layout;
  onPeek: OnPeek;
};

/** 예약 필요 일정 — 번호 원(주황) · 이름 · 「day 2 · 16:00 · 설명」 · 「예약 필요」 배지. 줄을 누르면 미리 보기 */
function ReserveCard({ tripId, rows, layout, onPeek }: ReserveCardProps) {
  return (
    <BoardCard
      title="예약 필요 일정"
      count={String(rows.length)}
      link={{ label: "일정", href: `/trips/${tripId}/schedule` }}
      layout={layout}
    >
      <ul className="flex flex-col">
        {rows.map((r) => (
          <BoardRow
            key={r.id}
            lead={
              <span className="mx-1.5 flex">
                <NumberMarker kind="place" num={r.num} status="wait" />
              </span>
            }
            title={r.title}
            sub={r.sub}
            trail={<ReservationBadge status="wait" className="shrink-0" />}
            onClick={() => onPeek(r.peek)}
          />
        ))}
      </ul>
    </BoardCard>
  );
}

type MemoCardProps = { memos: PreBoard["memos"]; layout: Layout; onPeek: OnPeek };

/** 고정한 메모 — ★ 중요 메모를 노란 칸으로. 칸을 누르면 미리 보기(어느 일정의 메모인지) */
function MemoCard({ memos, layout, onPeek }: MemoCardProps) {
  return (
    <BoardCard title="고정한 메모" layout={layout}>
      <ul className="flex flex-col gap-2">
        {memos.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onPeek(m.peek)}
              className="flex w-full cursor-pointer flex-col gap-1 rounded-memo bg-important-bg px-3.5 py-3 text-left"
            >
              <span className="text-xs font-extrabold text-important-text">★ 중요</span>
              <span className="text-sm/normal wrap-break-word whitespace-pre-line text-ink-900">
                {m.body}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </BoardCard>
  );
}

type PreBoardCardsProps = { tripId: string; board: PreBoard; layout: Layout; onPeek: OnPeek };

/**
 * 여행 전 상태판의 카드들(순서대로) — 여행 준비는 늘 보이고, 나머지는 내용이 있을 때만
 */
export function preBoardCards({ tripId, board, layout, onPeek }: PreBoardCardsProps) {
  return [
    { key: "prep", node: <PrepCard tripId={tripId} prep={board.prep} layout={layout} /> },
    board.deadlines.length > 0 && {
      key: "deadline",
      node: <DeadlineCard rows={board.deadlines} layout={layout} onPeek={onPeek} />,
    },
    board.reserves.length > 0 && {
      key: "reserve",
      node: <ReserveCard tripId={tripId} rows={board.reserves} layout={layout} onPeek={onPeek} />,
    },
    board.memos.length > 0 && {
      key: "memo",
      node: <MemoCard memos={board.memos} layout={layout} onPeek={onPeek} />,
    },
  ].filter((c) => c !== false);
}
