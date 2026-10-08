import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

import { dayOptions } from "./day-options";

/**
 * 「일정에서 가져옴」 묶음의 날짜 글 — 「2026.10.31 (토) · day 1」, 여행준비(빈 글)면 「여행준비」.
 * 여행 기간 밖의 날(기간이 바뀐 뒤)이면 day 없이 날짜만
 */
export function bundleDateText(startDate: string, endDate: string, spentOn: string): string {
  if (!spentOn) return "여행준비";
  const date = format(parseISO(spentOn), "yyyy.MM.dd (EEE)", { locale: ko });
  const option = dayOptions(startDate, endDate).find((o) => o.value === spentOn);
  return option ? `${date} · ${option.label}` : date;
}
