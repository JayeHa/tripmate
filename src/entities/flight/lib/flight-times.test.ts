import { describe, expect, it } from "vitest";

import { airlineFromCode, searchAirlines } from "./airlines";
import { airportFromCode, searchAirports } from "./airports";
import {
  dayDiff,
  directionLabel,
  durationLabel,
  flightDateLabel,
  flightMinutes,
} from "./flight-times";

/** 시안의 제주항공 7C1181 — 인천 07:15 → 나리타 09:40 */
const BASE = {
  dep_airport: "ICN",
  arr_airport: "NRT",
  dep_date: "2026-10-31",
  dep_time: "07:15:00",
  arr_date: "2026-10-31",
  arr_time: "09:40:00",
};

describe("flightMinutes", () => {
  it("같은 시간대면 시각 차이", () => {
    expect(flightMinutes(BASE)).toBe(145);
  });

  it("시간대가 다르면 시차를 뺀다 — 인천 09:00 → 방콕 13:00 은 6시간", () => {
    expect(
      flightMinutes({ ...BASE, arr_airport: "BKK", dep_time: "09:00", arr_time: "13:00" }),
    ).toBe(360);
  });

  it("날을 넘기면 하루를 더한다", () => {
    expect(
      flightMinutes({
        ...BASE,
        arr_airport: "SIN",
        dep_time: "22:00",
        arr_date: "2026-11-01",
        arr_time: "03:30",
      }),
    ).toBe(390);
  });

  it("모르는 공항이거나 도착이 출발보다 앞서면 null", () => {
    expect(flightMinutes({ ...BASE, arr_airport: "XYZ" })).toBeNull();
    expect(flightMinutes({ ...BASE, arr_time: "07:00" })).toBeNull();
  });
});

describe("표시", () => {
  it("날짜 · 소요 · 며칠 뒤", () => {
    expect(flightDateLabel("2026-10-31")).toBe("2026.10.31 (토)");
    expect(durationLabel(145)).toBe("2시간 25분");
    expect(durationLabel(120)).toBe("2시간");
    expect(durationLabel(45)).toBe("45분");
    expect(durationLabel(null)).toBe("");
    expect(dayDiff({ dep_date: "2026-10-31", arr_date: "2026-11-01" })).toBe(1);
  });

  it("방향 — 첫 편 가는 편, 마지막 편 오는 편, 가운데 항공편, 하나면 가는 편", () => {
    expect([0, 1, 2].map((i) => directionLabel(i, 3))).toEqual(["가는 편", "항공편", "오는 편"]);
    expect(directionLabel(0, 1)).toBe("가는 편");
  });
});

describe("항공사 · 공항 찾기", () => {
  it("빈 검색어면 앞 8개, 이름 · 코드로 찾는다", () => {
    expect(searchAirlines("")).toHaveLength(8);
    expect(searchAirlines("ke").map((a) => a.code)).toContain("KE");
    expect(searchAirlines("제주").map((a) => a.code)).toEqual(["7C"]);
    expect(searchAirports("도쿄").map((a) => a.code)).toEqual(["NRT", "HND"]);
    expect(searchAirports("kix").map((a) => a.code)).toEqual(["KIX"]);
  });

  it("코드 직접 입력 — 모양이 맞으면 대문자로, 목록에 있으면 그 이름", () => {
    expect(airlineFromCode("ke")).toEqual({ name: "대한항공", code: "KE" });
    expect(airlineFromCode("q9")).toEqual({ name: "Q9", code: "Q9" });
    expect(airlineFromCode("abc")).toBeNull();
    expect(airportFromCode("xyz")).toBe("XYZ");
    expect(airportFromCode("x1z")).toBeNull();
  });
});
