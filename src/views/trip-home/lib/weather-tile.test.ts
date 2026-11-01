import { describe, expect, it } from "vitest";

import { localToday, tripMonth, weatherOutfit, weatherPlan, weatherTile } from "./weather-tile";

describe("tripMonth", () => {
  it("여행 날이 가장 많은 달, 같으면 앞 달", () => {
    expect(tripMonth("2026-10-31", "2026-11-04")).toBe(11);
    expect(tripMonth("2026-10-30", "2026-11-02")).toBe(10);
    expect(tripMonth("2026-12-28", "2027-01-02")).toBe(12);
    expect(tripMonth("2026-07-10", "2026-07-10")).toBe(7);
  });
});

describe("weatherPlan", () => {
  const start = "2026-10-31";
  const end = "2026-11-04";

  it("여행 10일 전보다 이르면 평년", () => {
    expect(weatherPlan(start, end, "2026-10-20")).toEqual({ kind: "normals", month: 11 });
  });

  it("10일 전부터는 첫날 예보, 여행 중에는 오늘 예보", () => {
    expect(weatherPlan(start, end, "2026-10-21")).toEqual({
      kind: "forecast",
      date: start,
      first: true,
    });
    expect(weatherPlan(start, end, "2026-11-02")).toEqual({
      kind: "forecast",
      date: "2026-11-02",
      first: false,
    });
  });

  it("여행이 끝나면 없음", () => {
    expect(weatherPlan(start, end, "2026-11-05")).toBeNull();
  });
});

describe("localToday", () => {
  it("그 시간대의 날짜", () => {
    // 2026-11-01 05:32 UTC — 서울 11.1 14:32, 호놀룰루 10.31 19:32
    const at = new Date(Date.UTC(2026, 10, 1, 5, 32));
    expect(localToday("Asia/Seoul", at)).toBe("2026-11-01");
    expect(localToday("Pacific/Honolulu", at)).toBe("2026-10-31");
  });
});

describe("weatherTile", () => {
  const day = { date: "2026-11-01", code: 0, max: 18.4, min: 11.6, rain: 60 };

  it("평년 — 「12–19° · 11월 평년」", () => {
    expect(
      weatherTile({ kind: "normals", month: 11 }, undefined, { min: 11.6, max: 18.5 }),
    ).toEqual({ key: "weather", label: "날씨", main: "12–19°", sub: "11월 평년", sky: "partly" });
  });

  it("여행 중 예보 — 「날씨 · 맑음 · 18° · 최저 12° · 비 60%」", () => {
    expect(
      weatherTile({ kind: "forecast", date: day.date, first: false }, [day], undefined),
    ).toEqual({
      key: "weather",
      label: "날씨 · 맑음",
      main: "18°",
      sub: "최저 12° · 비 60%",
      sky: "clear",
    });
  });

  it("여행 전 예보는 첫날 것 — 코드 · 비 확률을 모르면 뺀다", () => {
    const tile = weatherTile(
      { kind: "forecast", date: day.date, first: true },
      [{ ...day, code: null, rain: null }],
      undefined,
    );
    expect(tile).toEqual({ key: "weather", label: "첫날", main: "18°", sub: "최저 12°" });
  });

  it("받기 전 · 그 날 예보가 없음 · 여행이 끝나면 null", () => {
    expect(weatherTile({ kind: "normals", month: 11 }, undefined, undefined)).toBeNull();
    expect(
      weatherTile({ kind: "forecast", date: "2026-11-30", first: false }, [day], undefined),
    ).toBeNull();
    expect(weatherTile(null, [day], { min: 1, max: 2 })).toBeNull();
  });
});

describe("weatherOutfit", () => {
  const day = { date: "2026-11-02", code: 61, max: 22, min: 13, rain: 95 };

  it("예보 — 오늘 · 첫날 라벨과 비 오면 우산까지", () => {
    expect(
      weatherOutfit({ kind: "forecast", date: day.date, first: false }, [day], undefined),
    ).toEqual({ label: "오늘", text: "맨투맨 · 가디건 · 긴바지 · 우산" });
    expect(
      weatherOutfit({ kind: "forecast", date: day.date, first: true }, [day], undefined)?.label,
    ).toBe("첫날");
  });

  it("평년 — 그 달 라벨, 기온만", () => {
    expect(
      weatherOutfit({ kind: "normals", month: 11 }, undefined, { min: 11.6, max: 18.5 }),
    ).toEqual({ label: "11월", text: "니트 · 자켓 · 청바지" });
  });

  it("받기 전 · 그 날 예보가 없으면 null", () => {
    expect(
      weatherOutfit({ kind: "forecast", date: "2026-11-03", first: false }, [day], undefined),
    ).toBeNull();
    expect(weatherOutfit(null, [day], undefined)).toBeNull();
  });
});
