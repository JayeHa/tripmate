import { type DateSelection, rangeCtaLabel } from "@/shared/lib/calendar";

/** 수정 CTA. 바뀐 게 없으면 그렇다고 알려 준다 */
export function editCtaLabel(selection: DateSelection, unchanged: boolean, busy: boolean) {
  if (busy) return "수정 중…";
  if (unchanged) return "바꿀 날짜를 골라 주세요";
  return rangeCtaLabel(selection, "수정 완료");
}
