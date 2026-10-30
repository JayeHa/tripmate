import { describe, expect, it } from "vitest";

import type { Trip } from "@/entities/trip";

import { infoRows, periodLabel, rateLines } from "./info-rows";

/** 표에 필요한 칸만 채운 여행 */
function trip(over: Partial<Trip> = {}): Trip {
  return {
    title: "도쿄 여행",
    start_date: "2026-10-31",
    end_date: "2026-11-04",
    home_currency: "KRW",
    exchange_rates: { JPY: { unit: 100, value: 920 } },
    ...over,
  } as Trip;
}

describe("periodLabel", () => {
  it("같은 해 — 끝은 월.일", () => {
    expect(periodLabel("2026-10-31", "2026-11-04")).toBe("2026.10.31 – 11.04 · 4박 5일");
  });
  it("해가 바뀌면 끝에도 연도", () => {
    expect(periodLabel("2026-12-30", "2027-01-02")).toBe("2026.12.30 – 2027.01.02 · 3박 4일");
  });
  it("같은 날이면 당일", () => {
    expect(periodLabel("2026-10-31", "2026-10-31")).toBe("2026.10.31 – 10.31 · 당일");
  });
});

describe("rateLines", () => {
  it("통화마다 한 줄, 반올림 끝자리는 지운다", () => {
    const t = trip({
      exchange_rates: { JPY: { unit: 100, value: 920.0000001 }, USD: { unit: 1, value: 1380 } },
    });
    expect(rateLines(t)).toEqual(["100 JPY = 920 KRW", "1 USD = 1,380 KRW"]);
  });
});

describe("infoRows", () => {
  it("다섯 줄 — 도시는 「·」 로 잇는다", () => {
    const rows = infoRows(trip(), ["도쿄", "오사카"]);
    expect(rows.map((r) => r.key)).toEqual(["title", "cities", "dates", "home", "rates"]);
    expect(rows[1].value).toBe("도쿄 · 오사카");
  });
  it("여행 환율이 없으면 「없음」 회색", () => {
    const rates = infoRows(trip({ exchange_rates: {} }), ["도쿄"])[4];
    expect(rates).toMatchObject({ value: "없음", empty: true });
  });
  it("도시를 아직 못 읽었으면 빈 값", () => {
    expect(infoRows(trip(), undefined)[1].value).toBe("");
  });
});
