import { type ChecklistItem, daysUntil } from "@/entities/checklist";
import type { Expense, ExpenseCategory } from "@/entities/expense";
import {
  itemName,
  type Memo,
  memosByItem,
  placeNumbers,
  type ScheduleItem,
} from "@/entities/schedule-item";
import { formatMoney } from "@/shared/lib/money";

/** 여행 준비 카드 — 체크리스트 완료 / 전체와 남은 일 셋 */
export type PrepStats = {
  done: number;
  total: number;
  /** 완료하지 않은 체크리스트 */
  remaining: number;
  /** 예약 필요 일정 */
  wait: number;
  /** 결제 예정(아직 안 낸) 비용 */
  unpaid: number;
};

/** 체크리스트 진행도와 예약 필요 · 결제 예정 개수 */
export function prepStats(
  checklist: ChecklistItem[],
  items: ScheduleItem[],
  expenses: Expense[],
): PrepStats {
  const done = checklist.filter((c) => c.status === "done").length;
  return {
    done,
    total: checklist.length,
    remaining: checklist.length - done,
    wait: items.filter((i) => i.status === "wait").length,
    unpaid: expenses.filter((e) => !e.paid).length,
  };
}

/** 마감 줄 오른쪽 글자의 색 — 지남 빨강 · 3일 안 주황 · 그 밖 회색 */
export type DueTone = "over" | "soon" | "later";

/** 마감 임박 한 줄 — 체크리스트 할 일이거나 결제 예정 비용 */
export type DeadlineRow =
  | { kind: "checklist"; id: string; title: string; due: string; tone: DueTone; right: string }
  | {
      kind: "payment";
      id: string;
      title: string;
      category: ExpenseCategory;
      due: string;
      tone: DueTone;
      right: string;
    };

/** 3일 안이면 주황 */
const SOON_DAYS = 3;

/** 마감 줄 오른쪽 — 지났으면 「지남」, 3일 안이면 「10.21 · D-2」 · 「10.19 · 오늘」, 그 밖은 「10.29」 */
function dueRight(due: string, today: string): { tone: DueTone; right: string } {
  const days = daysUntil(due, today);
  const [, m, d] = due.split("-").map(Number);
  const md = `${m}.${d}`;
  if (days < 0) return { tone: "over", right: "지남" };
  if (days > SOON_DAYS) return { tone: "later", right: md };
  return { tone: "soon", right: `${md} · ${days === 0 ? "오늘" : `D-${days}`}` };
}

/**
 * 마감일이 있는 안 끝난 일 — 완료하지 않은 체크리스트 · 아직 내지 않은 비용. 마감이 이른 순(지난 것이 맨 위).
 * 같은 날이면 체크리스트가 먼저
 */
export function deadlineRows(
  checklist: ChecklistItem[],
  expenses: Expense[],
  today: string,
): DeadlineRow[] {
  const todos: DeadlineRow[] = checklist
    .filter((c) => c.status !== "done" && c.due_date)
    .map((c) => ({
      kind: "checklist",
      id: c.id,
      title: c.title,
      due: c.due_date!,
      ...dueRight(c.due_date!, today),
    }));
  const pays: DeadlineRow[] = expenses
    .filter((e) => !e.paid && e.due_date)
    .map((e) => ({
      kind: "payment",
      id: e.id,
      title: `${e.name} ${formatMoney(Number(e.amount), e.currency)}`,
      category: e.category as ExpenseCategory,
      due: e.due_date!,
      ...dueRight(e.due_date!, today),
    }));
  return [...todos, ...pays].sort((a, b) => a.due.localeCompare(b.due));
}

/** 예약 필요 일정 한 줄 */
export type ReserveRow = {
  id: string;
  /** 그날의 장소 번호(타임라인 · 지도와 같은 값). 위치 없는 일정이면 null */
  num: number | null;
  title: string;
  /** 「day 2 · 16:00 · 일몰 무렵 전망대」 — 시간 · 설명은 있을 때만 */
  sub: string;
};

/** 날짜 · 순서대로 */
function bySchedule(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => a.day_index - b.day_index || a.position - b.position);
}

/** 예약 필요(wait) 일정 — 날짜 · 순서대로. 번호는 그날 일정으로 매긴다 */
export function reserveRows(items: ScheduleItem[]): ReserveRow[] {
  const ordered = bySchedule(items);
  return ordered
    .filter((i) => i.status === "wait")
    .map((i) => ({
      id: i.id,
      num: placeNumbers(ordered.filter((d) => d.day_index === i.day_index)).get(i.id) ?? null,
      title: itemName(i),
      sub: [`day ${i.day_index + 1}`, i.start_time?.slice(0, 5), i.description]
        .filter(Boolean)
        .join(" · "),
    }));
}

/** 날짜 메모는 note 일정의 제목 한 칸이라 중요 표시를 글 앞의 「★ 」 로 둔다(일정 화면의 날짜 메모 창과 같은 규칙) */
const DAY_MEMO_STAR = "★ ";

/** 고정한 메모 한 장 */
export type PinnedMemo = { id: string; body: string };

/**
 * 중요(★) 메모 — 장소에 단 메모와 날짜 메모. 일정 순서대로(같은 일정의 메모는 쓴 순)
 */
export function pinnedMemos(memos: Memo[], items: ScheduleItem[]): PinnedMemo[] {
  const starred = memosByItem(memos.filter((m) => m.starred));
  return bySchedule(items).flatMap((item): PinnedMemo[] => {
    if (item.kind === "note" && item.name?.startsWith(DAY_MEMO_STAR))
      return [{ id: item.id, body: item.name.slice(DAY_MEMO_STAR.length) }];
    return (starred.get(item.id) ?? []).map((m) => ({ id: m.id, body: m.body }));
  });
}
