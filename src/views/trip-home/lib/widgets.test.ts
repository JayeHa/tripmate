import { describe, expect, it } from "vitest";

import { localTimeText, offsetFromKorea, offsetLabel, widgetTiles } from "./widgets";

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
  const base = { home: "KRW", rates: { JPY: { unit: 100, value: 920 } }, at: AT };

  it("도쿄 — 환율만(시차 없음)", () => {
    expect(widgetTiles({ ...base, currency: "JPY", timeZone: "Asia/Tokyo" })).toEqual([
      { key: "rate", label: "환율", main: "₩920", sub: "100엔" },
    ]);
  });

  it("국내 · 환율 없는 통화는 환율을 숨기고, 시차가 있으면 현지 시간", () => {
    expect(widgetTiles({ ...base, currency: "KRW", timeZone: "Asia/Seoul" })).toEqual([]);
    expect(widgetTiles({ ...base, currency: "THB", timeZone: "Asia/Bangkok" })).toEqual([
      { key: "time", label: "현지 시간", main: "12:32", sub: "한국보다 2시간 느림" },
    ]);
  });
});
