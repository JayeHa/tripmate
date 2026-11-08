import { describe, expect, it } from "vitest";

import {
  durationText,
  flightSegment,
  placeSegment,
  routeLineStyle,
  routeTotals,
  segmentChip,
  segmentMeta,
} from "./route";

const TOKYO_STATION = { lat: 35.6812, lng: 139.7671 };
/** 도쿄역에서 약 0.5km */
const NEAR = { lat: 35.6812, lng: 139.7726 };
/** 스카이트리 — 도쿄역에서 약 5.1km */
const SKYTREE = { lat: 35.7101, lng: 139.8107 };
/** 나리타 공항 — 약 58km */
const NARITA = { lat: 35.772, lng: 140.3929 };

describe("placeSegment", () => {
  it("수단이 없으면 추정 — 1.2km 이하 도보, 그 외 대중교통(20km 넘으면 버스 아이콘)", () => {
    expect(placeSegment(TOKYO_STATION, NEAR, "10:00")).toMatchObject({
      mode: "walk",
      icon: "🚶",
      minutes: 6,
      estimated: true,
      depTime: "09:54",
    });
    expect(placeSegment(TOKYO_STATION, SKYTREE, "10:00")).toMatchObject({
      mode: "transit",
      icon: "🚇",
      minutes: 20,
      estimated: true,
      depTime: "09:40",
      modeName: "대중교통",
    });
    expect(placeSegment(TOKYO_STATION, NARITA, null)).toMatchObject({
      icon: "🚌",
      depTime: null,
    });
  });

  it("적은 수단이 있으면 그 수단 — 추정이 아니고 상세를 옆 글자로", () => {
    const seg = placeSegment(TOKYO_STATION, NARITA, "12:10", {
      mode: "bus",
      detail: "TYO-NRT 긴자행 · 1,500엔",
    });
    expect(seg).toMatchObject({ mode: "transit", icon: "🚌", estimated: false, modeName: "버스" });
    expect(segmentChip(seg)).toBe("🚌 1시간 45분");
    expect(segmentMeta(seg)).toBe("버스 · 10:25 출발 · TYO-NRT 긴자행 · 1,500엔");
  });

  it("도보로 적으면 먼 거리도 도보 식(13분/km)이고 옆 글자는 없다", () => {
    const seg = placeSegment(TOKYO_STATION, SKYTREE, "10:00", { mode: "walk", detail: null });
    expect(seg).toMatchObject({ mode: "walk", minutes: 66, estimated: false });
    expect(segmentMeta(seg)).toBe("");
  });

  it("장소 사이에 항공을 적으면 시간을 모른다 — 파선만, 칩 · 옆 글자 없음", () => {
    const fukuoka = { lat: 33.5902, lng: 130.4017 };
    const seg = placeSegment(TOKYO_STATION, fukuoka, "12:00", { mode: "flight", detail: null });
    expect(seg).toMatchObject({ mode: "flight", minutes: null, depTime: null });
    expect(segmentChip(seg)).toBeNull();
    expect(segmentMeta(seg)).toBe("");
    expect(routeLineStyle(seg.mode, "plan").style).toBe("dashed");
  });

  it("좌표가 없으면 칩 없는 구간, 같은 자리(50m 이하)는 선만", () => {
    expect(placeSegment(null, SKYTREE, "10:00").mode).toBe("none");
    expect(segmentChip(placeSegment(null, SKYTREE, "10:00"))).toBeNull();
    const same = placeSegment(TOKYO_STATION, TOKYO_STATION, "10:00");
    expect(same).toMatchObject({ mode: "walk", minutes: null });
    expect(segmentChip(same)).toBeNull();
  });

  it("출발 시각은 자정을 넘겨 돌아간다", () => {
    expect(placeSegment(TOKYO_STATION, SKYTREE, "00:10")?.depTime).toBe("23:50");
  });
});

describe("flightSegment", () => {
  it("편명 시각으로 비행 시간 · 출발 시각, 날짜를 넘기면 그만큼 더한다", () => {
    const seg = flightSegment({
      dep_date: "2026-10-31",
      dep_time: "07:15:00",
      arr_date: "2026-10-31",
      arr_time: "09:40:00",
    });
    expect(seg).toMatchObject({ mode: "flight", minutes: 145, depTime: "07:15" });
    expect(segmentChip(seg)).toBe("✈️ 2시간 25분");
    expect(segmentMeta(seg)).toBe("비행 · 07:15 출발");
    expect(
      flightSegment({
        dep_date: "2026-11-04",
        dep_time: "23:30",
        arr_date: "2026-11-05",
        arr_time: "01:00",
      }).minutes,
    ).toBe(90);
  });
});

describe("durationText", () => {
  it.each([
    [25, "25분"],
    [60, "1시간"],
    [75, "1시간 15분"],
  ])("%s분 → %s", (m, text) => {
    expect(durationText(m)).toBe(text);
  });
});

describe("routeLineStyle", () => {
  it("계획은 수단 색 · 목록 굵기, 지도는 굵기와 도보 색이 다르다", () => {
    expect(routeLineStyle("transit", "plan")).toEqual({
      width: 8,
      style: "solid",
      color: "#3A8BFF",
    });
    expect(routeLineStyle("walk", "plan")).toEqual({ width: 4, style: "dotted", color: "#A0A7B1" });
    expect(routeLineStyle("walk", "plan", { onMap: true })).toEqual({
      width: 3,
      style: "dotted",
      color: "#7D8590",
    });
    expect(routeLineStyle("flight", "plan").style).toBe("dashed");
  });

  it("기록 모드는 선 종류를 두고 색만 — 지나온 초록, 남은 연회색", () => {
    expect(routeLineStyle("walk", "done")).toEqual({ width: 4, style: "dotted", color: "#10B981" });
    expect(routeLineStyle("transit", "todo").color).toBe("#DDE1E6");
    expect(routeLineStyle("walk", "todo").color).toBe("#D7DCE2");
    expect(routeLineStyle("transit", "todo", { onMap: true }).color).toBe("#C9CDD2");
  });
});

describe("routeTotals", () => {
  it("대중교통 · 도보 분을 따로 더한다(항공 · 칩 없는 구간 · 마지막 역 null 은 뺀다)", () => {
    const walk = placeSegment(TOKYO_STATION, NEAR, null);
    const transit = placeSegment(TOKYO_STATION, SKYTREE, null);
    const flight = flightSegment({
      dep_date: "2026-10-31",
      dep_time: "07:15",
      arr_date: "2026-10-31",
      arr_time: "09:40",
    });
    expect(routeTotals([walk, transit, flight, placeSegment(null, NEAR, null), null])).toEqual({
      transit: 20,
      walk: 6,
    });
  });
});
