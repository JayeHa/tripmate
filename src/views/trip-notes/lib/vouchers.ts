import { differenceInCalendarDays, parseISO } from "date-fns";

import {
  ownedBy,
  type Voucher,
  VOUCHER_GROUPS,
  type VoucherGroup,
  voucherGroup,
  voucherNumbers,
  voucherTarget,
  type VoucherTargetRef,
} from "@/entities/voucher";
import type { TargetSources } from "@/features/checklist";
import { dayParts } from "@/shared/lib/days";

/** 날짜 필터의 「날짜 없음」 값 */
export const NO_DAY = "none";

/** 목록 필터 — 사람(멤버 id) · 날짜(day 순번 글자 · NO_DAY) · 종류(묶음). 「전체」 는 FILTER_ALL */
export type VoucherFilters = { who: string; day: string; group: string };

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

/** 날짜 필터 값 — day 순번 글자, 없으면 NO_DAY */
export function dayKey(day: number | null): string {
  return day === null ? NO_DAY : String(day);
}

/** 날짜 필터 옵션 — 「day 1 · 10.31」 …, 맨 끝 「날짜 없음」 */
export function dayOptions(startDate: string, totalDays: number) {
  return [
    ...Array.from({ length: totalDays }, (_, i) => ({
      value: String(i),
      label: dayText(startDate, i),
    })),
    { value: NO_DAY, label: "날짜 없음" },
  ];
}

/** 필터에 맞는가 — 사람 필터는 주인이 빈(모두) 바우처도 포함한다 */
export function matchesFilters(
  v: Voucher,
  filters: VoucherFilters,
  dayOf: (v: Voucher) => number | null,
  all: string,
): boolean {
  if (filters.who !== all && !ownedBy(v, filters.who)) return false;
  if (filters.day !== all && dayKey(dayOf(v)) !== filters.day) return false;
  return filters.group === all || voucherGroup(v) === filters.group;
}

/** 묶음 — 항공편 · 숙소 · 일정 · 기타 순, 빈 묶음은 뺀다. 묶음 안은 받은 순서(넣은 순서) */
export function groupVouchers(list: Voucher[]): { group: VoucherGroup; items: Voucher[] }[] {
  return VOUCHER_GROUPS.map((group) => ({
    group,
    items: list.filter((v) => voucherGroup(v) === group),
  })).filter((g) => g.items.length > 0);
}

/** 줄의 보조 글 — 「{연결 이름} · {첫 번호}」, 둘 다 없으면 「연결된 일정 없음」 */
export function voucherSubText(v: Voucher, targetName: string | null): string {
  const first = voucherNumbers(v)[0]?.value ?? null;
  return [targetName, first].filter(Boolean).join(" · ") || "연결된 일정 없음";
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
