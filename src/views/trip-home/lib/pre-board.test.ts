import { describe, expect, it } from "vitest";

import type { ChecklistItem } from "@/entities/checklist";
import type { Expense } from "@/entities/expense";
import type { Memo, ScheduleItem } from "@/entities/schedule-item";

import { deadlineRows, pinnedMemos, prepStats, reserveRows } from "./pre-board";

/** 테스트용 체크리스트 항목 — 필요한 칸만 */
function todo(id: string, status: string, due: string | null = null): ChecklistItem {
  return { id, status, title: id, due_date: due } as ChecklistItem;
}

/** 테스트용 비용 — 필요한 칸만 */
function pay(id: string, paid: boolean, due: string | null = null): Expense {
  return {
    id,
    paid,
    due_date: due,
    name: id,
    amount: 466240,
    currency: "KRW",
    category: "lodging",
  } as Expense;
}

/** 테스트용 일정 — 위치 있는 장소면 번호가 붙는다 */
function item(
  id: string,
  day: number,
  pos: number,
  extra: Partial<ScheduleItem> = {},
): ScheduleItem {
  return {
    id,
    day_index: day,
    position: pos,
    kind: "place",
    name: null,
    status: null,
    start_time: null,
    description: null,
    place: { name: id, lat: 35.7, lng: 139.8 },
    ...extra,
  } as ScheduleItem;
}

/** 미리 보기 주소 · 날짜에 쓰는 여행 정보 */
const ctx = { tripId: "t1", startDate: "2026-10-31", today: "2026-10-19" };

/** 미리 보기를 비운 줄 — 줄 모양만 비교할 때(toEqual 은 undefined 칸을 없는 칸으로 본다) */
function withoutPeek<T>(rows: T[]): T[] {
  return rows.map((r) => ({ ...r, peek: undefined }));
}

/** 테스트용 메모 */
function memo(id: string, itemId: string, starred: boolean, at: string): Memo {
  return { id, schedule_item_id: itemId, starred, body: id, created_at: at } as Memo;
}

describe("prepStats", () => {
  it("체크리스트 완료 / 전체와 예약 필요 · 결제 예정 개수", () => {
    const checklist = [todo("a", "done"), todo("b", "todo"), todo("c", "etc")];
    const items = [item("x", 0, 0, { status: "wait" }), item("y", 0, 1, { status: "ok" })];
    const expenses = [pay("p", false), pay("q", true)];
    expect(prepStats(checklist, items, expenses)).toEqual({
      done: 1,
      total: 3,
      remaining: 2,
      wait: 1,
      unpaid: 1,
    });
  });
});

describe("deadlineRows", () => {
  it("마감 있는 안 끝난 일만, 이른 순 · 같은 날이면 체크리스트 먼저", () => {
    const rows = deadlineRows(
      [
        todo("later", "todo", "2026-10-29"),
        todo("over", "todo", "2026-10-18"),
        todo("done", "done", "2026-10-18"),
        todo("nodue", "todo"),
        todo("same", "todo", "2026-10-21"),
      ],
      [pay("rent", false, "2026-10-21"), pay("paid", true, "2026-10-20"), pay("nodue", false)],
      ctx,
    );
    expect(rows.map((r) => r.id)).toEqual(["over", "same", "rent", "later"]);
  });

  it("지남 빨강 · 3일 안 주황(날짜 · D-n) · 그 밖 회색(날짜만)", () => {
    const rows = deadlineRows(
      [
        todo("over", "todo", "2026-10-18"),
        todo("today", "todo", "2026-10-19"),
        todo("d3", "todo", "2026-10-22"),
        todo("d4", "todo", "2026-10-23"),
      ],
      [],
      ctx,
    );
    expect(rows.map((r) => [r.tone, r.right])).toEqual([
      ["over", "지남"],
      ["soon", "10.19 · 오늘"],
      ["soon", "10.22 · D-3"],
      ["later", "10.23"],
    ]);
  });

  it("결제 예정은 이름 뒤에 금액, 카테고리를 가진다", () => {
    const [row] = deadlineRows([], [pay("숙소 잔금", false, "2026-10-21")], ctx);
    expect(row).toMatchObject({
      kind: "payment",
      title: "숙소 잔금 ₩466,240",
      category: "lodging",
    });
  });
});

describe("reserveRows", () => {
  it("예약 필요 일정만 날짜 · 순서대로, 번호는 그날 장소 순서", () => {
    const rows = reserveRows(
      [
        item("sky", 1, 3, { status: "wait", start_time: "16:00:00", description: "일몰 무렵" }),
        item("a", 1, 1),
        item("note", 1, 2, { kind: "note", name: "메모", place: null }),
        item("first", 0, 0, { status: "wait" }),
      ],
      ctx,
    );
    expect(withoutPeek(rows)).toEqual([
      { id: "first", num: 1, title: "first", sub: "day 1" },
      { id: "sky", num: 2, title: "sky", sub: "day 2 · 16:00 · 일몰 무렵" },
    ]);
  });
});

describe("pinnedMemos", () => {
  it("중요 메모와 ★ 날짜 메모를 일정 순서대로", () => {
    const items = [
      item("b", 1, 0),
      item("dayNote", 0, 1, { kind: "note", name: "★ 문화의 날", place: null }),
      item("plain", 0, 2, { kind: "note", name: "그냥 메모", place: null }),
      item("a", 0, 0),
    ];
    const memos = [
      memo("a2", "a", true, "2026-10-02"),
      memo("a1", "a", true, "2026-10-01"),
      memo("skip", "a", false, "2026-10-01"),
      memo("b1", "b", true, "2026-10-01"),
    ];
    expect(withoutPeek(pinnedMemos(memos, items, ctx))).toEqual([
      { id: "a1", body: "a1" },
      { id: "a2", body: "a2" },
      { id: "dayNote", body: "문화의 날" },
      { id: "b1", body: "b1" },
    ]);
  });
});
