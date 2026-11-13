import { describe, expect, it } from "vitest";

import { cleanNoteBody, notesByItem, type VisitNote } from "./visit-note";

/** 기록 글 한 줄 */
function note(item_id: string, updated_by: string | null, body: string): VisitNote {
  return { item_id, updated_by, body, trip_id: "t", updated_at: "2027-01-01T00:00:00Z" };
}

describe("notesByItem", () => {
  it("일정 id 별로 그 일정의 글 — 누가 고쳤든 함께 쓰는 하나", () => {
    const a = note("a", "friend", "줄 40분");
    const b = note("b", "me", "또 올래");
    expect(notesByItem([a, b])).toEqual({ a, b });
  });

  it("글이 없으면 빈 값", () => {
    expect(notesByItem([])).toEqual({});
  });
});

describe("cleanNoteBody", () => {
  it("앞뒤 공백을 떼고 안쪽 줄바꿈은 둔다", () => {
    expect(cleanNoteBody("  첫 줄\n둘째 줄 \n")).toBe("첫 줄\n둘째 줄");
  });

  it("공백뿐이면 빈 문자열(지우기)", () => {
    expect(cleanNoteBody(" \n ")).toBe("");
  });
});
