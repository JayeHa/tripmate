import {
  ownedBy,
  type Voucher,
  VOUCHER_GROUPS,
  type VoucherGroup,
  voucherGroup,
  voucherNumbers,
} from "@/entities/voucher";
import { dayText } from "@/widgets/trip-voucher";

/** 날짜 필터의 「날짜 없음」 값 */
export const NO_DAY = "none";

/** 목록 필터 — 사람(멤버 id) · 날짜(day 순번 글자 · NO_DAY) · 종류(묶음). 「전체」 는 FILTER_ALL */
export type VoucherFilters = { who: string; day: string; group: string };

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
