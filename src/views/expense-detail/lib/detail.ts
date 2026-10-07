import { dateToDayIndex, dayLabel } from "@/shared/lib/days";

/** 「날짜」 칸 — 날짜가 없으면 「여행준비」, 아니면 「day 2 · 10.30 (금)」. 기간 밖 날짜는 목록처럼 첫날 · 마지막 날로 붙인다 */
export function detailDateText(
  spentOn: string | null,
  trip: { start_date: string; end_date: string },
): string {
  if (spentOn === null) return "여행준비";
  const day = dateToDayIndex(trip.start_date, trip.end_date, spentOn);
  return `day ${day + 1} · ${dayLabel(trip.start_date, day)}`;
}

/** 「결제 상태」 칸 — 「결제 완료」, 예정이면 「11/2 결제 예정」(예정일이 없으면 「결제 예정」) */
export function paymentStatusText(paid: boolean, dueDate: string | null): string {
  if (paid) return "결제 완료";
  if (!dueDate) return "결제 예정";
  const [, month, day] = dueDate.split("-").map(Number);
  return `${month}/${day} 결제 예정`;
}
