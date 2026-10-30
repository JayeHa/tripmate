import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "@/entities/schedule-item";

import { altPins } from "./alt-map";

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
