import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "@/entities/schedule-item";

import { altPins, neighborPins } from "./alt-map";

/** 테스트용 장소 일정 — 좌표만 */
function item(id: string, lat: number | null, lng: number | null): ScheduleItem {
  return { id, kind: "place", place: { lat, lng } } as ScheduleItem;
}

describe("altPins", () => {
  const main = item("main", 35.7295, 139.7109);

  it("좌표 있는 대체 장소만 A · B 순서, 지금 장소에서 도보 N분", () => {
    const pins = altPins(main, [
      item("a", 35.7305, 139.7109),
      item("none", null, null),
      item("b", 35.659, 139.701),
    ]);
    expect(pins.map((p) => [p.alt.id, p.tag, p.walk])).toEqual([
      ["a", "A", "도보 2분"],
      ["b", "B", "10.3km"],
    ]);
  });

  it("지금 장소에 좌표가 없으면 지도를 그리지 않는다", () => {
    expect(altPins(item("main", null, null), [item("a", 35.73, 139.71)])).toEqual([]);
  });
});

/** 테스트용 그날 일정 — 날짜 · 순서 · 이름 · 좌표(null 이면 메모) */
function dayItem(id: string, position: number, at: [number, number] | null, day = 1): ScheduleItem {
  return {
    id,
    day_index: day,
    position,
    alternative_of: null,
    kind: at ? "place" : "note",
    name: id,
    place: at ? { name: id, lat: at[0], lng: at[1], category: "food" } : null,
  } as ScheduleItem;
}

describe("neighborPins", () => {
  it("같은 날 바로 앞 · 뒤 장소 — 메모는 건너뛰고 번호는 일정 화면과 같다", () => {
    const items = [
      dayItem("run", 0, [35.68, 139.76]),
      dayItem("note", 1, null),
      dayItem("main", 2, [35.67, 139.765]),
      dayItem("shop", 3, [35.69, 139.7]),
      dayItem("other-day", 0, [35.6, 139.7], 2),
    ];
    const pins = neighborPins(items, items[2]);
    expect(pins.map((p) => [p.id, p.num, p.label])).toEqual([
      ["run", 1, "직전 · run"],
      ["shop", 3, "직후 · shop"],
    ]);
  });

  it("앞 · 뒤가 같은 자리면 핀 하나로 묶는다", () => {
    const items = [
      dayItem("hotel", 0, [35.6724, 139.7668]),
      dayItem("main", 1, [35.6705, 139.7665]),
      dayItem("hotel-again", 2, [35.67241, 139.76681]),
    ];
    const pins = neighborPins(items, items[1]);
    expect(pins.map((p) => [p.id, p.num, p.label])).toEqual([["hotel", 1, "직전 · 직후 · hotel"]]);
  });

  it("그날 첫 일정이면 직후만, 일정 목록에 없으면 빈 배열", () => {
    const items = [dayItem("main", 0, [35.67, 139.76]), dayItem("next", 1, [35.68, 139.77])];
    expect(neighborPins(items, items[0]).map((p) => p.id)).toEqual(["next"]);
    expect(neighborPins(items, dayItem("ghost", 5, [35.6, 139.7]))).toEqual([]);
  });
});
