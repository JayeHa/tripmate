import { describe, expect, it } from "vitest";

import type { TimelineRow } from "@/entities/schedule-item";

import { withStayCards } from "./stay-cards";

const stay = {
  id: "s1",
  check_in_date: "2027-11-01",
  check_out_date: "2027-11-04",
  check_in_time: "15:00:00",
  check_out_time: "10:00:00",
};

/** 줄 — 연결된 숙소 id 만 본다 */
const row = (id: string, stayId: string | null) =>
  ({ item: { id, stay_id: stayId }, stay: null }) as unknown as TimelineRow;

const START = "2027-10-31";

describe("withStayCards", () => {
  it("체크인 날 맨 위 카드만 자세히, 같은 날 두 번째는 간략히", () => {
    const [a, b, c] = withStayCards(
      [row("a", "s1"), row("b", null), row("c", "s1")],
      [stay],
      START,
      1,
    );
    expect(a.stay).toEqual({ mode: "in", inText: "11.1 (월) 15:00", outText: "11.4 (목) 10:00" });
    expect(b.stay).toBeNull();
    expect(c.stay).toEqual({ mode: "mid", line: "숙박 1/3박 · 체크아웃 11.4 10:00" });
  });

  it("중간 날 · 체크아웃 날 · 체크인 전 날", () => {
    expect(withStayCards([row("a", "s1")], [stay], START, 2)[0].stay).toEqual({
      mode: "mid",
      line: "숙박 2/3박 · 체크아웃 11.4 10:00",
    });
    expect(withStayCards([row("a", "s1")], [stay], START, 4)[0].stay).toEqual({
      mode: "mid",
      line: "체크아웃 10:00",
    });
    expect(withStayCards([row("a", "s1")], [stay], START, 0)[0].stay).toEqual({
      mode: "mid",
      line: "체크인 전",
    });
  });

  it("숙소를 못 찾으면 일반 카드, 숙소가 없으면 그대로", () => {
    const rows = [row("a", "s9")];
    expect(withStayCards(rows, [stay], START, 1)[0].stay).toBeNull();
    expect(withStayCards(rows, [], START, 1)).toBe(rows);
  });
});
