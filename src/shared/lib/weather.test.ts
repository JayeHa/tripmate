import { describe, expect, it } from "vitest";

import { averageNormals, normalsRanges, parseCoords, parseForecast, skyOf } from "./weather";

describe("skyOf", () => {
  it("WMO 코드 → 하늘 모양, 모르는 코드는 null", () => {
    expect(skyOf(0)).toBe("clear");
    expect(skyOf(1)).toBe("clear");
    expect(skyOf(2)).toBe("partly");
    expect(skyOf(3)).toBe("cloudy");
    expect(skyOf(51)).toBe("drizzle");
    expect(skyOf(63)).toBe("rain");
    expect(skyOf(81)).toBe("rain");
    expect(skyOf(75)).toBe("snow");
    expect(skyOf(95)).toBe("storm");
    expect(skyOf(30)).toBeNull();
    expect(skyOf(null)).toBeNull();
  });
});

describe("parseForecast", () => {
  it("날짜마다 한 줄, 기온을 모르는 날은 뺀다", () => {
    const json = {
      daily: {
        time: ["2026-10-31", "2026-11-01", "2026-11-12"],
        weather_code: [1, 51, null],
        temperature_2m_max: [21.7, 16.7, null],
        temperature_2m_min: [11.4, 10.5, 10.3],
        precipitation_probability_max: [12, null, 29],
      },
    };
    expect(parseForecast(json)).toEqual([
      { date: "2026-10-31", code: 1, max: 21.7, min: 11.4, rain: 12 },
      { date: "2026-11-01", code: 51, max: 16.7, min: 10.5, rain: null },
    ]);
  });

  it("모양이 다르면 null", () => {
    expect(parseForecast(null)).toBeNull();
    expect(parseForecast({ error: true, reason: "x" })).toBeNull();
    expect(parseForecast({ daily: { time: "x" } })).toBeNull();
  });
});

describe("averageNormals", () => {
  it("모든 해의 모든 날을 함께 평균(소수 한 자리)", () => {
    const year = (max: (number | null)[], min: number[]) => ({
      daily: { temperature_2m_max: max, temperature_2m_min: min },
    });
    expect(averageNormals([year([18, 20], [10, 12]), year([19, null], [11])])).toEqual({
      min: 11,
      max: 19,
    });
    expect(averageNormals([year([18.25], [10.04])])).toEqual({ min: 10, max: 18.3 });
  });

  it("값이 없으면 null", () => {
    expect(averageNormals([])).toBeNull();
    expect(averageNormals([{ error: true }])).toBeNull();
  });
});

describe("normalsRanges", () => {
  it("올해 바로 앞 10년의 그 달 — 2월은 윤년을 따른다", () => {
    const ranges = normalsRanges(2, 2026);
    expect(ranges).toHaveLength(10);
    expect(ranges[0]).toEqual({ start: "2016-02-01", end: "2016-02-29" });
    expect(ranges[9]).toEqual({ start: "2025-02-01", end: "2025-02-28" });
    expect(normalsRanges(11, 2026)[9]).toEqual({ start: "2025-11-01", end: "2025-11-30" });
  });
});

describe("parseCoords", () => {
  const params = (q: string) => new URLSearchParams(q);

  it("소수 둘째 자리로 맞춘다", () => {
    expect(parseCoords(params("lat=35.6762&lng=139.6503"))).toEqual({ lat: 35.68, lng: 139.65 });
  });

  it("빠졌거나 범위 밖이면 null", () => {
    expect(parseCoords(params("lat=35"))).toBeNull();
    expect(parseCoords(params("lat=&lng="))).toBeNull();
    expect(parseCoords(params("lat=91&lng=0"))).toBeNull();
    expect(parseCoords(params("lat=abc&lng=0"))).toBeNull();
  });
});
