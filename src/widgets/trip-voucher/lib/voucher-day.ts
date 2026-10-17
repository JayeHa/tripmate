import { differenceInCalendarDays, parseISO } from "date-fns";

import { type Voucher, voucherTarget, type VoucherTargetRef } from "@/entities/voucher";
import type { TargetSources } from "@/features/checklist";
import { dayParts } from "@/shared/lib/days";

/** 날짜 → 0 부터의 day 순번. 여행 기간 밖이면 null */
function dayOfDate(startDate: string, totalDays: number, date: string): number | null {
  const i = differenceInCalendarDays(parseISO(date), parseISO(startDate));
  return i >= 0 && i < totalDays ? i : null;
}

/**
 * 바우처의 날짜(day 순번) — 일정 카드면 그 날, 항공편이면 탑승일, 숙소면 **체크인 날**, 연결이 없으면 사용일.
 * 대상을 찾지 못했거나 여행 기간 밖이면 null(「날짜 없음」)
 */
export function voucherDay(v: Voucher, src: TargetSources, totalDays: number): number | null {
  const ref = voucherTarget(v);
  if (!ref) return v.use_date ? dayOfDate(src.startDate, totalDays, v.use_date) : null;
  return targetDay(ref, src, totalDays);
}

/** 연결 대상의 날짜(day 순번) — voucherDay 의 연결이 있을 때 규칙 */
export function targetDay(
  ref: VoucherTargetRef,
  src: TargetSources,
  totalDays: number,
): number | null {
  const onDate = (date: string | null | undefined) =>
    date ? dayOfDate(src.startDate, totalDays, date) : null;
  if (ref.kind === "flight") return onDate(src.flights.find((f) => f.id === ref.id)?.dep_date);
  if (ref.kind === "stay") return onDate(src.stays.find((s) => s.id === ref.id)?.check_in_date);
  const item = [...src.items, ...src.alternatives].find((i) => i.id === ref.id);
  return item ? item.day_index : null;
}

/** 날짜 글 — 「day 2 · 10.21」, 없으면 「날짜 없음」(날짜 필터 옵션과 같은 모양) */
export function dayText(startDate: string, day: number | null): string {
  return day === null ? "날짜 없음" : `day ${day + 1} · ${dayParts(startDate, day).date}`;
}

/** 주인 글 — 「정원, 동규」, 비면 「모두」. 이름을 못 찾은 사람(나간 멤버)은 빼고, 아무도 못 찾으면 「알 수 없음」 */
export function ownersText(owners: string[], nameOf: (id: string) => string | null): string {
  if (owners.length === 0) return "모두";
  return (
    owners
      .map(nameOf)
      .filter((n): n is string => !!n)
      .join(", ") || "알 수 없음"
  );
}
