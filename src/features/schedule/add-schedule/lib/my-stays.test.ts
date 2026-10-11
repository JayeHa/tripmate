import { describe, expect, it } from "vitest";

import type { Stay } from "@/entities/stay";

import { myStayRows, stayGoogleIds } from "./my-stays";

/** 숙소 — 필요한 칸만 */
const stay = (
  id: string,
  inDate: string,
  outDate: string,
  name: string,
  google: string | null = null,
) =>
  ({
    id,
    check_in_date: inDate,
    check_out_date: outDate,
    check_in_time: "15:00:00",
    check_out_time: null,
    place: { name, address: "Ginza", google_place_id: google },
  }) as unknown as Stay;

const A = stay("a", "2027-10-31", "2027-11-01", "몬토레");
const B = stay("b", "2027-11-02", "2027-11-04", "에어비앤비", "g-b");

describe("myStayRows", () => {
  it("그날 묵는 숙소가 먼저, 범위 · 시각 줄 · 그날 담긴 수", () => {
    const items = [
      { stay_id: "b", day_index: 3, alternative_of: null },
      { stay_id: "b", day_index: 3, alternative_of: "x" },
      { stay_id: "b", day_index: 2, alternative_of: null },
    ];
    const rows = myStayRows([A, B], items, "2027-11-03", 3, "");
    expect(rows.map((r) => [r.stay.id, r.now, r.countToday])).toEqual([
      ["b", true, 1],
      ["a", false, 0],
    ]);
    expect(rows[0]).toMatchObject({ rangeText: "11.2–11.4", times: "체크인 15:00" });
  });

  it("체크아웃 날도 묵는 날로 보고, 검색어는 이름 · 주소로 거른다", () => {
    expect(myStayRows([A, B], [], "2027-11-01", 1, "")[0].stay.id).toBe("a");
    expect(myStayRows([A, B], [], "2027-11-01", 1, "에어").map((r) => r.stay.id)).toEqual(["b"]);
    expect(myStayRows([A, B], [], "2027-11-01", 1, "ginza")).toHaveLength(2);
  });
});

describe("stayGoogleIds", () => {
  it("구글 장소인 숙소만", () => {
    expect([...stayGoogleIds([A, B])]).toEqual(["g-b"]);
  });
});
