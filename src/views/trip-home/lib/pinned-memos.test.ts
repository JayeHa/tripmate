import { describe, expect, it } from "vitest";

import type { Memo, ScheduleItem } from "@/entities/schedule-item";

import { pinnedMemos } from "./pinned-memos";

const ctx = { tripId: "t1", startDate: "2026-10-31", today: "2026-10-27" };

/** 테스트용 일정 — 장소 하나(note 면 장소 없이) */
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
    pinned_by: null,
    place: { name: id },
    ...extra,
  } as ScheduleItem;
}

/** 테스트용 메모 */
function memo(id: string, itemId: string, pinned: boolean, starred: boolean, at: string): Memo {
  return {
    id,
    schedule_item_id: itemId,
    pinned_by: pinned ? "u1" : null,
    starred,
    body: id,
    created_at: at,
  } as Memo;
}

describe("pinnedMemos", () => {
  it("고정한 장소 메모와 날짜 메모만 일정 순서대로 — ★ 중요여도 고정하지 않으면 빠진다", () => {
    const note = { kind: "note", place: null } as const;
    const items = [
      item("b", 1, 0),
      item("dayNote", 0, 1, { ...note, name: "★ 문화의 날", pinned_by: "u1" }),
      item("starOnly", 0, 2, { ...note, name: "★ 중요만" }),
      item("a", 0, 0),
    ];
    const memos = [
      memo("a2", "a", true, false, "2026-10-02"),
      memo("a1", "a", true, true, "2026-10-01"),
      memo("skip", "a", false, true, "2026-10-01"),
      memo("b1", "b", true, false, "2026-10-01"),
    ];
    // 미리 보기는 비우고 줄 모양만 비교한다(toEqual 은 undefined 칸을 없는 칸으로 본다)
    const rows = pinnedMemos(memos, items, ctx).map((r) => ({ ...r, peek: undefined }));
    expect(rows).toEqual([
      { id: "a1", body: "a1", starred: true, where: "day 1 · a" },
      { id: "a2", body: "a2", starred: false, where: "day 1 · a" },
      { id: "dayNote", body: "문화의 날", starred: true, where: "day 1 메모" },
      { id: "b1", body: "b1", starred: false, where: "day 2 · b" },
    ]);
  });
});
