import { describe, expect, it } from "vitest";

import type { Place, ScheduleItem } from "@/entities/schedule-item";

import {
  alternativeChoices,
  hasOwnRecord,
  linkedChecklistNote,
  linkedExpenseNote,
  linkedExpensesOf,
  swapDoneMessage,
  swapQuestion,
} from "./alternatives";

/** 기본값이 채워진 장소 */
function place(id: string, patch: Partial<Place> = {}): Place {
  return {
    id,
    city_id: "tokyo",
    created_by: "u",
    name: id,
    google_place_id: null,
    lat: 35.7,
    lng: 139.7,
    address: null,
    address_local: null,
    address_ko: null,
    address_detail: null,
    category: null,
    emoji: null,
    rating: null,
    review_count: null,
    wait: null,
    description: null,
    hours: null,
    hours_week: null,
    gmap_url: null,
    links: [],
    created_at: "",
    updated_at: "",
    ...patch,
  };
}

/** 그 장소를 쓰는 일정 */
function item(placeId: string, patch: Partial<ScheduleItem> = {}): ScheduleItem {
  return {
    id: `i-${placeId}`,
    trip_id: "t",
    day_index: 0,
    position: 0,
    kind: "place",
    place_id: placeId,
    name: null,
    description: null,
    emoji: null,
    start_time: null,
    status: null,
    alternative_of: null,
    stay_id: null,
    flight_id: null,
    links: [],
    created_by: null,
    created_at: "",
    updated_at: "",
    place: place(placeId),
    ...patch,
  };
}

describe("alternativeChoices", () => {
  const saved = [
    place("머메이드 커피"),
    place("아시츠보", { category: "rest", description: "발 지압" }),
    place("선샤인시티", { category: "shop" }),
  ];

  it("이 일정 · 이미 붙은 대체 장소의 장소는 빼고, 아래 줄은 카테고리 · 설명", () => {
    const choices = alternativeChoices(saved, item("머메이드 커피"), [item("선샤인시티")], "");
    expect(choices.map((c) => [c.place.id, c.meta])).toEqual([["아시츠보", "휴식 · 발 지압"]]);
  });

  it("이름에 검색어가 든 것만(대소문자 무시)", () => {
    const all = [...saved, place("Sunshine Aquarium")];
    expect(alternativeChoices(all, item("x"), [], " sun ").map((c) => c.place.id)).toEqual([
      "Sunshine Aquarium",
    ]);
  });
});

describe("hasOwnRecord", () => {
  it("예약 상태 · 메모 · 일정 링크 · 연결된 비용 · 체크리스트 중 하나라도 있으면 true", () => {
    expect(hasOwnRecord(item("a"), 0)).toBe(false);
    expect(hasOwnRecord(item("a", { status: "ok" }), 0)).toBe(true);
    expect(hasOwnRecord(item("a"), 1)).toBe(true);
    expect(hasOwnRecord(item("a", { links: [{ title: "", url: "https://a" }] }), 0)).toBe(true);
    expect(hasOwnRecord(item("a"), 0, 2)).toBe(true);
    expect(hasOwnRecord(item("a"), 0, 0, 1)).toBe(true);
  });
});

describe("linkedChecklistNote", () => {
  it("연결이 있을 때만 안내한다", () => {
    expect(linkedChecklistNote(0)).toBeNull();
    expect(linkedChecklistNote(2)).toBe("연결된 체크리스트 2개는 연결만 풀리고 노트에 남아요.");
  });
});

describe("linkedExpensesOf · linkedExpenseNote", () => {
  it("그 줄에 연결된 비용과 그중 합계에서 빠진 것을 센다", () => {
    const expenses = [
      { schedule_item_id: "a", counted: false },
      { schedule_item_id: "b", counted: false },
      { schedule_item_id: "a", counted: true },
      { schedule_item_id: null, counted: false },
    ];
    expect(linkedExpensesOf(expenses, "a")).toEqual({ count: 2, excluded: 1 });
    expect(linkedExpensesOf(expenses, "c")).toEqual({ count: 0, excluded: 0 });
  });

  it("여러 줄을 함께 센다 — 일정을 지우면 대체 장소도 함께 지워진다", () => {
    const expenses = [
      { schedule_item_id: "main", counted: true },
      { schedule_item_id: "alt", counted: false },
      { schedule_item_id: "other", counted: true },
    ];
    expect(linkedExpensesOf(expenses, "main", "alt")).toEqual({ count: 2, excluded: 1 });
  });

  it("합계에서 빠진 비용이 있을 때만 그 말을 한다 — 사용자가 합계 스위치를 다시 켰을 수 있다", () => {
    expect(linkedExpenseNote({ count: 0, excluded: 0 })).toBeNull();
    expect(linkedExpenseNote({ count: 2, excluded: 2 })).toBe(
      "연결된 비용 2건은 가계부에 남지만 합계에서 빠진 채로 남아요.",
    );
    expect(linkedExpenseNote({ count: 1, excluded: 0 })).toBe("연결된 비용 1건은 가계부에 남아요.");
    expect(linkedExpenseNote({ count: 3, excluded: 1 })).toBe(
      "연결된 비용 3건은 가계부에 남아요. 그중 1건은 합계에서 빠진 채로 남아요.",
    );
  });
});

describe("바꾸기 문구", () => {
  it("「원래」 대신 「대체」 + 받침에 맞는 「로/으로」", () => {
    const main = item("치이카와 라멘 豚");
    expect(swapQuestion(main, item("다이소 라군"))).toBe(
      "「치이카와 라멘 豚」 대신 「다이소 라군」으로 바꿀까요?",
    );
    expect(swapDoneMessage(main, item("아시츠보 이치방"))).toBe(
      "「치이카와 라멘 豚」 대신 「아시츠보 이치방」으로 바꿨어요",
    );
    expect(swapDoneMessage(main, item("굿즈샵"))).toBe(
      "「치이카와 라멘 豚」 대신 「굿즈샵」으로 바꿨어요",
    );
    expect(swapDoneMessage(main, item("다이소"))).toBe(
      "「치이카와 라멘 豚」 대신 「다이소」로 바꿨어요",
    );
  });
});
