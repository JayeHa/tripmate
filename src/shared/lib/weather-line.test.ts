import { describe, expect, it } from "vitest";

import { dayWeatherLine } from "./weather-line";

describe("dayWeatherLine", () => {
  it("예보 — 하늘 · 기온(반올림) · 비 올 확률 · 「예보」", () => {
    expect(
      dayWeatherLine({ date: "d", code: 61, max: 18.4, min: 10.6, rain: 40, source: "forecast" }),
    ).toEqual({
      sky: "rain",
      skyLabel: "비",
      temps: "18° / 11°",
      rain: "비 40%",
      source: "예보",
      outfit: "니트 · 자켓 · 청바지",
    });
  });

  it("옷차림 — 비 올 확률이 높으면 우산까지", () => {
    expect(
      dayWeatherLine({ date: "d", code: 61, max: 22, min: 13, rain: 95, source: "forecast" })
        .outfit,
    ).toBe("맨투맨 · 가디건 · 긴바지 · 우산");
  });

  it("지난 날 기록은 출처 표시가 없고, 평년은 하늘 모양이 없다", () => {
    expect(
      dayWeatherLine({ date: "d", code: 3, max: 20, min: 12, rain: null, source: "record" }),
    ).toMatchObject({ sky: "cloudy", rain: null, source: null });
    expect(
      dayWeatherLine({ date: "d", code: null, max: 20, min: 12, rain: null, source: "normal" }),
    ).toMatchObject({ sky: null, skyLabel: null, source: "평년" });
  });

  it("비 올 확률 0% 는 적지 않는다", () => {
    expect(
      dayWeatherLine({ date: "d", code: 0, max: 20, min: 12, rain: 0, source: "forecast" }).rain,
    ).toBeNull();
  });
});
