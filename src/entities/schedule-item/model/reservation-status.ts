/**
 * 일정 아이템의 예약 상태. 세 가지뿐이고, 지정하지 않으면 「상태 없음」이다.
 */
export const RESERVATION_STATUSES = ["ok", "wait", "opt"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const RESERVATION_STATUS_LABEL = {
  ok: "예약 확정",
  wait: "예약 필요",
  opt: "임시",
} satisfies Record<ReservationStatus, string>;
