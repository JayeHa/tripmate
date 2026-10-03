import type { DateSelection } from "@/shared/lib/calendar";
import { dateRangeLabel } from "@/shared/lib/days";

/** 모바일 도시 단계 CTA. 두 곳까지 이름을 보이고 나머지는 「외 N곳」 (시안 5b) */
export function cityCtaLabel(names: readonly string[]) {
  if (names.length === 0) return "최소 1개 도시 선택";
  const shown =
    names.length > 2 ? `${names.slice(0, 2).join("·")} 외 ${names.length - 2}곳` : names.join("·");
  return `${shown} 선택 완료`;
}

/** 날짜 단계 CTA. 무엇을 눌러야 하는지 알려 주다가, 다 고르면 기간을 보여 준다 (시안 5c · 6c) */
export function dateCtaLabel(selection: DateSelection) {
  if (!selection) return "출발일을 선택해 주세요";
  if (!selection.end) return "도착일을 선택해 주세요";
  return `${dateRangeLabel(selection.start, selection.end)} / 등록 완료`;
}
