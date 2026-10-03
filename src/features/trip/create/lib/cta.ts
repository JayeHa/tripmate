import { type DateSelection, rangeCtaLabel } from "@/shared/lib/calendar";

/** 모바일 도시 단계 CTA. 두 곳까지 이름을 보이고 나머지는 「외 N곳」 (시안 5b) */
export function cityCtaLabel(names: readonly string[]) {
  if (names.length === 0) return "최소 1개 도시 선택";
  const shown =
    names.length > 2 ? `${names.slice(0, 2).join("·")} 외 ${names.length - 2}곳` : names.join("·");
  return `${shown} 선택 완료`;
}

/** PC 도시 단계 CTA (시안 6b) */
export function pcCityCtaLabel(count: number) {
  return count > 0 ? "다음 · 날짜 선택" : "최소 1개 도시 선택";
}

/** 날짜 단계 CTA. 무엇을 눌러야 하는지 알려 주다가, 다 고르면 기간을 보여 준다 (시안 5c · 6c) */
export function dateCtaLabel(selection: DateSelection, pending = false) {
  if (pending) return "만드는 중…";
  return rangeCtaLabel(selection, "등록 완료");
}
