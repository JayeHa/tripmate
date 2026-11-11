import { describe, expect, it } from "vitest";

import { cleanNoteBody, noteBodiesOf, type VisitNote } from "./visit-note";

/** 기록 글 한 줄 */
function note(item_id: string, user_id: string, body: string): VisitNote {
  return { item_id, user_id, body, trip_id: "t", updated_at: "2027-01-01T00:00:00Z" };
}

describe("noteBodiesOf", () => {
  it("그 사람의 글만 일정 id 별로 모은다", () => {
    const notes = [
      note("a", "me", "국물 진함"),
      note("a", "friend", "줄 40분"),
      note("b", "me", "또 올래"),
    ];
    expect(noteBodiesOf(notes, "me")).toEqual({ a: "국물 진함", b: "또 올래" });
  });

  it("사람을 모르면 빈 값", () => {
    expect(noteBodiesOf([note("a", "me", "x")], null)).toEqual({});
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
