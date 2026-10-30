import { describe, expect, it } from "vitest";

import type { Place } from "@/entities/schedule-item";

import type { GuideCard } from "./guide";
import {
  corePoints,
  directionsUrl,
  distanceM,
  freeCenterOffset,
  guidePins,
  mapPadding,
} from "./guide-map";

/** 테스트용 카드 — 좌표만 */
function card(id: string, lat: number | null, lng: number | null): GuideCard {
  return {
    place: { id, name: id, lat, lng } as Place,
    addedBy: null,
    memo: null,
    addedAt: "",
    day: null,
    emoji: null,
    inSchedule: false,
    area: null,
  };
}

describe("guidePins", () => {
  it("좌표 있는 카드만 1부터 번호, 없는 곳은 센다", () => {
    const { pins, noLocation } = guidePins([
      card("a", 35.7, 139.7),
      card("b", null, null),
      card("c", 35.71, 139.71),
    ]);
    expect(pins.map((p) => [p.card.place.id, p.num])).toEqual([
      ["a", 1],
      ["c", 2],
    ]);
    expect(noLocation).toBe(1);
  });
});

describe("corePoints · distanceM", () => {
  const ikebukuro = { lat: 35.7295, lng: 139.7109 };
  const shibuya = { lat: 35.659, lng: 139.701 };
  const shinjuku = { lat: 35.6915, lng: 139.702 };
  const kawagoe = { lat: 35.918, lng: 139.485 };
  const narita = { lat: 35.772, lng: 140.388 };

  it("이케부쿠로 ~ 시부야 약 8km", () => {
    expect(distanceM(ikebukuro, shibuya)).toBeGreaterThan(7500);
    expect(distanceM(ikebukuro, shibuya)).toBeLessThan(8500);
  });

  it("가운데 값에서 12km 밖(카와고에 · 나리타)은 첫 화면에서 뺀다", () => {
    expect(corePoints([ikebukuro, shibuya, shinjuku, kawagoe, narita])).toEqual([
      ikebukuro,
      shibuya,
      shinjuku,
    ]);
  });

  it("빈 목록은 빈 배열, 한 점은 그 점", () => {
    expect(corePoints([])).toEqual([]);
    expect(corePoints([narita])).toEqual([narita]);
  });
});

describe("directionsUrl", () => {
  it("목적지 좌표와 구글 장소 id", () => {
    expect(directionsUrl({ lat: 35.7, lng: 139.7 }, "ChIJ1")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=35.7%2C139.7&destination_place_id=ChIJ1",
    );
  });
});

describe("mapPadding · freeCenterOffset", () => {
  it("모바일은 아래 시트(절반, 최대 300)만큼, PC 는 왼쪽 패널만큼 비운다", () => {
    expect(mapPadding("mobile", 500).bottom).toBe(274);
    expect(mapPadding("mobile", 900).bottom).toBe(324);
    expect(mapPadding("pc", 700).left).toBe(420);
  });

  it("가리지 않는 칸 가운데로 옮기는 양 — 모바일은 아래로, PC 는 왼쪽으로", () => {
    expect(freeCenterOffset(mapPadding("mobile", 900))).toEqual([0, 150]);
    expect(freeCenterOffset(mapPadding("pc", 700))).toEqual([-190, 0]);
  });
});
