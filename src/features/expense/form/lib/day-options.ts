import { dayCount, dayIndexToDate, dayLabel } from "@/shared/lib/days";

export type DayOption = { value: string; label: string; sub: string };

/** 날짜 시트의 줄 — 여행준비(빈 글) 다음 day 1 … 마지막 날 */
export function dayOptions(startDate: string, endDate: string): DayOption[] {
  const days = Math.max(1, dayCount(startDate, endDate));
  return [
    { value: "", label: "여행준비", sub: "" },
    ...Array.from({ length: days }, (_, i) => ({
      value: dayIndexToDate(startDate, i),
      label: `day ${i + 1}`,
      sub: dayLabel(startDate, i),
    })),
  ];
}

/** 날짜 칸에 보일 글 — 「day 2 · 11.1 (일)」. 여행 기간이 바뀌어 목록에 없는 날이면 날짜 그대로 */
export function dayOptionText(options: DayOption[], value: string): string {
  const option = options.find((o) => o.value === value);
  if (!option) return value;
  return option.sub ? `${option.label} · ${option.sub}` : option.label;
}
