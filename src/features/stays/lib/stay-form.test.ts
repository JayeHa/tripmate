import { describe, expect, it } from "vitest";

import type { Stay } from "@/entities/stay";
import type { PickedLocation } from "@/shared/lib/google-places";

import {
  blankStayForm,
  datesChanged,
  nameAfterPick,
  stayFormForRegistration,
  stayFormFrom,
  toStayPayload,
} from "./stay-form";

const loc: PickedLocation = {
  lat: 35.67,
  lng: 139.76,
  googlePlaceId: "g1",
  name: "호텔 몬토레 긴자",
  address: "Ginza",
  addressLocal: "銀座",
  addressKo: "긴자",
  gmapUrl: "https://maps/x",
};

/** 저장할 수 있는 값 */
function filled() {
  return {
    ...blankStayForm(),
    name: "호텔",
    location: loc,
    checkIn: "2027-11-01",
    checkOut: "2027-11-03",
  };
}

describe("toStayPayload", () => {
  it("빠진 것을 순서대로 짚는다 — 주소 · 이름 · 날짜 · 시간 · 링크", () => {
    const v = blankStayForm();
    expect(toStayPayload(v)).toEqual({ ok: false, error: "주소를 정해 주세요" });
    expect(toStayPayload({ ...v, location: loc }).ok).toBe(false);
    expect(toStayPayload({ ...filled(), checkOut: null })).toMatchObject({
      error: "숙박 날짜를 골라 주세요",
    });
    expect(toStayPayload({ ...filled(), inTime: "25:00" })).toMatchObject({ ok: false });
    expect(toStayPayload({ ...filled(), links: [{ title: "x", url: "ftp://a" }] })).toMatchObject({
      ok: false,
    });
  });

  it("장소 · 예약 정보로 나누고, 빈 칸은 null · 빈 링크 줄은 버린다", () => {
    const r = toStayPayload({
      ...filled(),
      emoji: " ",
      memo: " 메모 ",
      links: [
        { title: " 가이드 ", url: " https://g " },
        { title: "", url: "" },
      ],
    });
    expect(r).toEqual({
      ok: true,
      place: {
        name: "호텔",
        lat: 35.67,
        lng: 139.76,
        address: "Ginza",
        address_local: "銀座",
        address_ko: "긴자",
        google_place_id: "g1",
        gmap_url: "https://maps/x",
      },
      fields: {
        emoji: "🏨",
        status: null,
        check_in_date: "2027-11-01",
        check_out_date: "2027-11-03",
        check_in_time: "15:00",
        check_out_time: "11:00",
        memo: "메모",
        links: [{ title: "가이드", url: "https://g" }],
      },
    });
  });
});

describe("stayFormFrom · datesChanged · nameAfterPick", () => {
  const stay = {
    emoji: "🛏️",
    status: "ok",
    check_in_date: "2027-11-01",
    check_out_date: "2027-11-03",
    check_in_time: "15:00:00",
    check_out_time: null,
    memo: null,
    links: [{ title: "a", url: "https://a" }],
    place: {
      name: "몬토레",
      lat: 1,
      lng: 2,
      google_place_id: null,
      address: "A",
      address_local: null,
      address_ko: null,
      gmap_url: null,
    },
  } as unknown as Stay;

  it("저장된 숙소 → 폼 값(시각은 HH:MM, 위치는 장소에서)", () => {
    const v = stayFormFrom(stay);
    expect(v.inTime).toBe("15:00");
    expect(v.outTime).toBe("");
    expect(v.location).toMatchObject({ lat: 1, lng: 2, name: "몬토레", gmapUrl: "" });
    expect(v.links).toEqual([{ title: "a", url: "https://a" }]);
    expect(datesChanged(v, stay)).toBe(false);
    expect(datesChanged({ ...v, checkOut: "2027-11-04" }, stay)).toBe(true);
  });

  it("위치를 고르면 손대지 않은 이름만 바뀐다", () => {
    expect(nameAfterPick(blankStayForm(), loc)).toBe("호텔 몬토레 긴자");
    expect(nameAfterPick({ ...blankStayForm(), name: "내 숙소" }, loc)).toBe("내 숙소");
    const auto = { ...blankStayForm(), name: loc.name, location: loc };
    expect(nameAfterPick(auto, { ...loc, name: "다른 호텔" })).toBe("다른 호텔");
    expect(nameAfterPick(auto, { ...loc, name: "", googlePlaceId: null })).toBe(loc.name);
  });
});

describe("stayFormForRegistration", () => {
  it("일정의 장소 · 아이콘 · 날짜로 채우고, 체크아웃 · 상태는 비운다", () => {
    const v = stayFormForRegistration({
      itemId: "i1",
      emoji: "🛌",
      checkIn: "2027-11-01",
      place: {
        name: "몬토레",
        lat: 35.67,
        lng: 139.76,
        google_place_id: "g1",
        address: "Ginza",
        address_local: "銀座",
        address_ko: "긴자",
        gmap_url: null,
      },
    });
    expect(v).toMatchObject({ name: "몬토레", emoji: "🛌", checkIn: "2027-11-01", checkOut: null });
    expect(v.status).toBeNull();
    expect(v.location).toMatchObject({ googlePlaceId: "g1", addressKo: "긴자", gmapUrl: "" });
  });

  it("좌표가 없는 옛 장소면 위치를 비워 다시 고르게 한다", () => {
    const v = stayFormForRegistration({
      itemId: "i1",
      emoji: null,
      checkIn: "2027-11-01",
      place: {
        name: "옛 숙소",
        lat: null,
        lng: null,
        google_place_id: null,
        address: null,
        address_local: null,
        address_ko: null,
        gmap_url: null,
      },
    });
    expect(v.location).toBeNull();
    expect(v.emoji).toBe("");
  });
});
