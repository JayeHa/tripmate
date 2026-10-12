import { describe, expect, it } from "vitest";

import type { Flight } from "@/entities/flight";

import {
  blankFlightForm,
  flightFormFrom,
  flightSavedToast,
  isFlightFormComplete,
  outsideTrip,
  toFlightFields,
} from "./flight-form";

/** 다 채운 폼 */
const FILLED = {
  ...blankFlightForm("2026-10-31"),
  airlineName: "제주항공",
  airlineCode: "7C",
  flightNo: "1181",
  depAirport: "ICN",
  arrAirport: "NRT",
  depTime: "07:15",
  arrTime: "09:40",
};

describe("toFlightFields", () => {
  it("다 채우면 저장 값 — 도착일이 비면 출발일, 빈 예약번호는 null", () => {
    expect(isFlightFormComplete(FILLED)).toBe(true);
    expect(toFlightFields({ ...FILLED, bookingRef: "  " })).toEqual({
      ok: true,
      fields: {
        airline_name: "제주항공",
        airline_code: "7C",
        flight_no: "1181",
        dep_airport: "ICN",
        arr_airport: "NRT",
        dep_date: "2026-10-31",
        dep_time: "07:15",
        arr_date: "2026-10-31",
        arr_time: "09:40",
        status: null,
        booking_ref: null,
      },
    });
  });

  it("빈 칸 · 잘못된 시간 · 같은 공항 · 도착일이 앞섬은 문구", () => {
    expect(isFlightFormComplete({ ...FILLED, depTime: "" })).toBe(false);
    expect(toFlightFields({ ...FILLED, depTime: "" })).toMatchObject({ ok: false });
    expect(toFlightFields({ ...FILLED, arrTime: "25:00" })).toMatchObject({
      error: "시간을 00:00 ~ 23:59 사이로 입력해 주세요",
    });
    expect(toFlightFields({ ...FILLED, arrAirport: "ICN" })).toMatchObject({
      error: "출발 공항과 도착 공항이 같아요",
    });
    expect(toFlightFields({ ...FILLED, arrDate: "2026-10-30" })).toMatchObject({
      error: "도착일은 출발일과 같거나 뒤여야 해요",
    });
  });
});

describe("flightFormFrom", () => {
  it("저장된 값을 폼으로 — 시각은 HH:MM, 같은 날 도착이면 도착일을 비운다", () => {
    const f = {
      airline_name: "제주항공",
      airline_code: "7C",
      flight_no: "1181",
      dep_airport: "ICN",
      arr_airport: "NRT",
      dep_date: "2026-10-31",
      dep_time: "07:15:00",
      arr_date: "2026-10-31",
      arr_time: "09:40:00",
      status: "ok",
      booking_ref: "ABC",
    } as Flight;
    expect(flightFormFrom(f)).toEqual({ ...FILLED, status: "ok", bookingRef: "ABC" });
    expect(flightFormFrom({ ...f, arr_date: "2026-11-01" }).arrDate).toBe("2026-11-01");
  });
});

describe("기간 · 토스트", () => {
  it("탑승일이 여행 기간 밖인지", () => {
    const trip = { start_date: "2026-10-31", end_date: "2026-11-04" };
    expect(outsideTrip("2026-10-30", trip)).toBe(true);
    expect(outsideTrip("2026-11-04", trip)).toBe(false);
  });

  it("카드가 어떻게 됐는지 알린다", () => {
    expect(flightSavedToast(false, "added")).toBe("항공편을 등록했어요 · 일정에 카드를 넣었어요");
    expect(flightSavedToast(false, null)).toBe(
      "항공편을 등록했어요 · 여행 기간 밖이라 일정에는 넣지 않았어요",
    );
    expect(flightSavedToast(true, null)).toBe("항공편을 수정했어요");
    expect(flightSavedToast(true, "removed")).toBe(
      "항공편을 수정했어요 · 여행 기간 밖이라 일정 카드를 지웠어요",
    );
  });
});
