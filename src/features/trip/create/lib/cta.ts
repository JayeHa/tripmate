import { type DateSelection, rangeCtaLabel } from "@/shared/lib/calendar";

/** PC 도시 단계 CTA */
export function pcCityCtaLabel(count: number) {
  return count > 0 ? "다음 · 날짜 선택" : "최소 1개 도시 선택";
}

/** 날짜 단계 CTA. 무엇을 눌러야 하는지 알려 주다가, 다 고르면 기간을 보여 준다 */
export function dateCtaLabel(selection: DateSelection, pending = false) {
  if (pending) return "만드는 중…";
  return rangeCtaLabel(selection, "등록 완료");
}
