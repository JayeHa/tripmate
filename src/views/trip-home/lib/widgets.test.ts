import { describe, expect, it } from "vitest";

import { holidayTile, localTimeText, offsetFromKorea, offsetLabel, widgetTiles } from "./widgets";

/** 2026-11-01 05:32 UTC — 한국 14:32 */
const AT = new Date(Date.UTC(2026, 10, 1, 5, 32));

describe("offsetFromKorea", () => {
  it("한국보다 빠르면 양수, 느리면 음수(서머타임은 그 시각 기준)", () => {
    expect(offsetFromKorea("Asia/Tokyo", AT)).toBe(0);
    expect(offsetFromKorea("Asia/Bangkok", AT)).toBe(-120);
    expect(offsetFromKorea("Pacific/Auckland", AT)).toBe(240);
    // 7월 마드리드는 서머타임(UTC+2) → 한국보다 7시간 느림, 11월은 8시간
    expect(offsetFromKorea("Europe/Madrid", new Date(Date.UTC(2026, 6, 1)))).toBe(-420);
    expect(offsetFromKorea("Europe/Madrid", AT)).toBe(-480);
  });
});

describe("offsetLabel", () => {
  it("시간 · 분과 빠름 · 느림", () => {
    expect(offsetLabel(0)).toBe("한국과 같음");
    expect(offsetLabel(60)).toBe("한국보다 1시간 빠름");
    expect(offsetLabel(-150)).toBe("한국보다 2시간 30분 느림");
    expect(offsetLabel(-30)).toBe("한국보다 30분 느림");
  });
});

describe("localTimeText", () => {
  it("그 시간대의 24시간 시각", () => {
    expect(localTimeText("Asia/Bangkok", AT)).toBe("12:32");
    expect(localTimeText("Asia/Seoul", new Date(Date.UTC(2026, 10, 1, 15, 5)))).toBe("00:05");
  });
});

describe("widgetTiles", () => {
  const base = {
    home: "KRW",
    rates: { JPY: { unit: 100, value: 920 } },
    at: AT,
    live: null,
    weather: null,
    holidays: undefined,
    start: "2026-10-31",
    today: "2026-11-01",
  };

  it("도쿄 — 환율만(시차 없음)", () => {
    expect(widgetTiles({ ...base, currency: "JPY", timeZone: "Asia/Tokyo" })).toEqual([
      { key: "rate", label: "환율", main: "₩920", sub: "100엔" },
    ]);
  });

  it("실시간 환율을 알면 단위 옆에 「지금」 값", () => {
    expect(
      widgetTiles({ ...base, currency: "JPY", timeZone: "Asia/Tokyo", live: 905.4 })[0].sub,
    ).toBe("100엔 · 지금 905");
  });

  it("국내 · 환율 없는 통화는 환율을 숨기고, 시차가 있으면 현지 시간", () => {
    expect(widgetTiles({ ...base, currency: "KRW", timeZone: "Asia/Seoul" })).toEqual([]);
    expect(widgetTiles({ ...base, currency: "THB", timeZone: "Asia/Bangkok" })).toEqual([
      { key: "time", label: "현지 시간", main: "12:32", sub: "한국보다 2시간 느림" },
    ]);
  });

  it("공휴일은 환율과 현지 시간 사이", () => {
    const tiles = widgetTiles({
      ...base,
      currency: "THB",
      timeZone: "Asia/Bangkok",
      rates: { THB: { unit: 1, value: 40 } },
      holidays: [{ date: "2026-11-03", name: "Culture Day" }],
    });
    expect(tiles.map((t) => t.key)).toEqual(["rate", "holiday", "time"]);
  });

  it("날씨는 맨 앞 — 국내 여행에도", () => {
    const weather = { key: "weather", label: "날씨", main: "12–19°", sub: "11월 평년" } as const;
    expect(widgetTiles({ ...base, currency: "KRW", timeZone: "Asia/Seoul", weather })).toEqual([
      weather,
    ]);
    expect(
      widgetTiles({ ...base, currency: "JPY", timeZone: "Asia/Tokyo", weather }).map((t) => t.key),
    ).toEqual(["weather", "rate"]);
  });
});

describe("holidayTile", () => {
  const list = [
    { date: "2026-11-03", name: "Culture Day" },
    { date: "2026-11-05", name: "Other Day" },
  ];

  it("여행 전 — 첫 공휴일의 날짜와 이름", () => {
    expect(holidayTile(list, "2026-10-31", "2026-10-20")).toEqual({
      key: "holiday",
      label: "공휴일",
      holiday: true,
      main: "11.3 (화)",
      sub: "Culture Day",
    });
  });

  it("여행 중 — 다음 공휴일까지 남은 날(오늘이면 「오늘」)", () => {
    expect(holidayTile(list, "2026-10-31", "2026-11-01")).toMatchObject({
      main: "D-2",
      sub: "11.3 Culture Day",
    });
    expect(holidayTile(list, "2026-10-31", "2026-11-03")?.main).toBe("오늘");
    expect(holidayTile(list, "2026-10-31", "2026-11-04")).toMatchObject({
      main: "D-1",
      sub: "11.5 Other Day",
    });
  });

  it("공휴일이 없거나 다 지났으면 없음", () => {
    expect(holidayTile([], "2026-10-31", "2026-10-20")).toBeNull();
    expect(holidayTile(list, "2026-10-31", "2026-11-06")).toBeNull();
  });
});
