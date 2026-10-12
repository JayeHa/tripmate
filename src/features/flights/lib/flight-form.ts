import type { Flight, FlightCardChange, FlightFieldsInput } from "@/entities/flight";
import type { ReservationStatus } from "@/entities/schedule-item";
import { isTimeValue } from "@/shared/lib/time-input";

/** 항공편 입력 폼의 값 — 입력 칸이 다루는 문자열 그대로. 저장할 때 toFlightFields 로 바꾼다 */
export type FlightFormValues = {
  status: ReservationStatus | null;
  /** 항공사 — 고르기 전에는 "" */
  airlineName: string;
  airlineCode: string;
  /** 편명 숫자 1–4자리 */
  flightNo: string;
  /** 공항 코드 — 고르기 전에는 "" */
  depAirport: string;
  arrAirport: string;
  depDate: string;
  /** 「HH:MM」 또는 "" */
  depTime: string;
  /** "" = 출발일과 같은 날 */
  arrDate: string;
  arrTime: string;
  bookingRef: string;
};

/** 새 항공편 — 출발일은 여행 첫날, 나머지는 비어 있다 */
export function blankFlightForm(depDate: string): FlightFormValues {
  return {
    status: null,
    airlineName: "",
    airlineCode: "",
    flightNo: "",
    depAirport: "",
    arrAirport: "",
    depDate,
    depTime: "",
    arrDate: "",
    arrTime: "",
    bookingRef: "",
  };
}

/** 저장된 항공편을 폼 값으로. 도착일이 출발일과 같으면 비워 둔다(출발일을 바꾸면 따라가게) */
export function flightFormFrom(f: Flight): FlightFormValues {
  return {
    status: (f.status as ReservationStatus | null) ?? null,
    airlineName: f.airline_name,
    airlineCode: f.airline_code,
    flightNo: f.flight_no,
    depAirport: f.dep_airport,
    arrAirport: f.arr_airport,
    depDate: f.dep_date,
    depTime: f.dep_time.slice(0, 5),
    arrDate: f.arr_date === f.dep_date ? "" : f.arr_date,
    arrTime: f.arr_time.slice(0, 5),
    bookingRef: f.booking_ref ?? "",
  };
}

/** 칸이 모두 찼는지 — 「완료」 를 켠다(예약 상태 · 예약번호 · 도착일은 선택) */
export function isFlightFormComplete(v: FlightFormValues): boolean {
  return (
    !!(v.airlineCode && v.flightNo && v.depAirport && v.arrAirport && v.depDate) &&
    !!(v.depTime && v.arrTime)
  );
}

/** 도착일 — 비었으면 출발일 */
export function arrivalDate(v: FlightFormValues): string {
  return v.arrDate || v.depDate;
}

/** 저장 전에 사용자가 고칠 수 있는 첫 문제. 없으면 null */
function problemOf(v: FlightFormValues): string | null {
  if (!isFlightFormComplete(v)) return "빈 칸을 채워 주세요";
  if (!isTimeValue(v.depTime) || !isTimeValue(v.arrTime)) {
    return "시간을 00:00 ~ 23:59 사이로 입력해 주세요";
  }
  if (v.depAirport === v.arrAirport) return "출발 공항과 도착 공항이 같아요";
  return arrivalDate(v) < v.depDate ? "도착일은 출발일과 같거나 뒤여야 해요" : null;
}

export type FlightPayload = { ok: true; fields: FlightFieldsInput } | { ok: false; error: string };

/** 폼 값을 save_flight 에 보낼 모양으로 */
export function toFlightFields(v: FlightFormValues): FlightPayload {
  const problem = problemOf(v);
  if (problem) return { ok: false, error: problem };
  return {
    ok: true,
    fields: {
      airline_name: v.airlineName,
      airline_code: v.airlineCode,
      flight_no: v.flightNo,
      dep_airport: v.depAirport,
      arr_airport: v.arrAirport,
      dep_date: v.depDate,
      dep_time: v.depTime,
      arr_date: arrivalDate(v),
      arr_time: v.arrTime,
      status: v.status,
      booking_ref: v.bookingRef.trim() || null,
    },
  };
}

/** 탑승일이 여행 기간 밖인지 — 밖이면 일정 카드가 없다 */
export function outsideTrip(depDate: string, trip: { start_date: string; end_date: string }) {
  return depDate < trip.start_date || depDate > trip.end_date;
}

/** 저장 토스트 — 일정 카드가 어떻게 됐는지까지 */
export function flightSavedToast(editing: boolean, card: FlightCardChange): string {
  const head = editing ? "항공편을 수정했어요" : "항공편을 등록했어요";
  if (card === "added") return `${head} · 일정에 카드를 넣었어요`;
  if (card === "moved") return `${head} · 일정 카드를 탑승일로 옮겼어요`;
  if (card === "removed") return `${head} · 여행 기간 밖이라 일정 카드를 지웠어요`;
  return editing ? head : `${head} · 여행 기간 밖이라 일정에는 넣지 않았어요`;
}
