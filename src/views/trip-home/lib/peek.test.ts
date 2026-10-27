import { describe, expect, it } from "vitest";

import type { ChecklistItem } from "@/entities/checklist";
import type { Expense } from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";

import { checklistPeek, memoPeek, paymentPeek, schedulePeek } from "./peek";

const ctx = { tripId: "t1", startDate: "2026-10-31", today: "2026-10-27" };

/** 테스트용 일정 — 장소 하나 */
function place(extra: Partial<ScheduleItem> = {}): ScheduleItem {
  return {
    id: "sky",
    day_index: 1,
    kind: "place",
    name: null,
    start_time: null,
    description: null,
    place: { name: "도쿄 스카이트리" },
    ...extra,
  } as ScheduleItem;
}

describe("checklistPeek", () => {
  it("마감 · 메모, 노트 체크리스트에서 그 할 일을 연다", () => {
    const item = {
      id: "c1",
      title: "치이카와 목록 확인",
      due_date: "2026-10-27",
      body: "  최신 목록  ",
    } as ChecklistItem;
    expect(checklistPeek(item, ctx)).toEqual({
      heading: "체크리스트",
      title: "치이카와 목록 확인",
      facts: [{ label: "마감", value: "10/27(화) · 오늘" }],
      body: "최신 목록",
      link: { label: "노트에서 보기", href: "/trips/t1/notes?tab=checklist&open=c1" },
    });
  });
});

describe("paymentPeek", () => {
  it("금액 · 결제 예정일 · 메모, 비용 상세로 한 단계 들어간다", () => {
    const expense = {
      id: "e1",
      name: "숙소 잔금",
      amount: 466240,
      currency: "KRW",
      due_date: "2026-10-30",
      memo: null,
    } as Expense;
    expect(paymentPeek(expense, ctx)).toEqual({
      heading: "결제 예정",
      title: "숙소 잔금",
      facts: [
        { label: "금액", value: "₩466,240" },
        { label: "결제 예정", value: "10/30(금) · D-3" },
      ],
      body: "",
      link: { label: "가계부에서 보기", href: "/trips/t1/expenses/e1", forward: true },
    });
  });
});

describe("schedulePeek", () => {
  it("날짜 · 시간(있을 때만) · 설명, 그 날의 일정 상세를 연다", () => {
    const peek = schedulePeek(place({ start_time: "15:30:00", description: "450m 포함권" }), ctx);
    expect(peek.facts).toEqual([
      { label: "날짜", value: "day 2 · 11.1 (일)" },
      { label: "시간", value: "15:30" },
    ]);
    expect(peek.body).toBe("450m 포함권");
    expect(peek.link.href).toBe("/trips/t1/schedule?day=1&open=sky");
    expect(schedulePeek(place(), ctx).facts).toHaveLength(1);
  });
});

describe("memoPeek", () => {
  it("장소 메모는 장소 이름, 날짜 메모는 「day N 메모」 — 둘 다 그 일정을 연다", () => {
    expect(memoPeek(place(), "박물관 붐빔", ctx)).toMatchObject({
      heading: "중요 메모",
      title: "도쿄 스카이트리",
      body: "박물관 붐빔",
      important: true,
      link: { href: "/trips/t1/schedule?day=1&open=sky" },
    });
    const note = place({ id: "n1", kind: "note", name: "★ 문화의 날", place: null });
    expect(memoPeek(note, "문화의 날", ctx).title).toBe("day 2 메모");
  });
});
