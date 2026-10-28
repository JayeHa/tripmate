import {
  ownedBy,
  type Voucher,
  VOUCHER_GROUPS,
  type VoucherGroup,
  voucherGroup,
  voucherNumbers,
  voucherTarget,
} from "@/entities/voucher";
import type { TargetSources } from "@/features/checklist";
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

/** 정렬 키 — 앞 칸부터 비교한다. 한 묶음 안에서만 비교한다 — 같은 자리에 같은 종류(일정은 숫자, 항공편 · 숙소 · 기타는 날짜 글)가 와야 순서가 맞다 */
type OrderKey = (number | string)[];

/** 연결한 항공편 · 숙소를 찾지 못하면 — 그 묶음의 맨 뒤(날짜 글 「2026-…」 보다 뒤인 글) */
const UNKNOWN: OrderKey = ["~"];

/**
 * 일정의 자리 — [날짜, 그날 순서, 0]. 대체 장소는 원래 일정 바로 뒤([…, 1]), 원래 일정을 못 찾으면 그 날의 맨 뒤.
 * 일정을 못 찾으면(지워짐) 맨 뒤 — 같은 칸에 숫자만 오게 Infinity(숫자와 글을 섞어 비교하면 순서가 뒤집힌다)
 */
function itemOrder(id: string, src: TargetSources): OrderKey {
  const item = src.items.find((i) => i.id === id);
  if (item) return [item.day_index, item.position, 0];
  const alt = src.alternatives.find((i) => i.id === id);
  if (!alt) return [Infinity];
  const parent = src.items.find((i) => i.id === alt.alternative_of);
  return parent ? [parent.day_index, parent.position, 1] : [alt.day_index, Infinity, 1];
}

/**
 * 묶음 안의 순서 키 — 일정은 날짜 → 그날 일정 순서(일정 화면과 같은 순서), 항공편은 출발 날짜 · 시각, 숙소는 체크인 날짜,
 * 연결 없음은 사용일(없으면 뒤). 연결 대상을 못 찾으면 뒤
 */
export function voucherOrder(v: Voucher, src: TargetSources): OrderKey {
  const ref = voucherTarget(v);
  if (!ref) return [v.use_date ?? "~"];
  if (ref.kind === "flight") {
    const f = src.flights.find((x) => x.id === ref.id);
    return f ? [f.dep_date, f.dep_time] : UNKNOWN;
  }
  if (ref.kind === "stay") {
    const s = src.stays.find((x) => x.id === ref.id);
    return s ? [s.check_in_date] : UNKNOWN;
  }
  return itemOrder(ref.id, src);
}

/** 두 정렬 키 비교 — 앞 칸부터, 짧은 쪽이 먼저 */
function compareOrder(a: OrderKey, b: OrderKey): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i];
    const y = b[i];
    if (x === y) continue;
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    return x < y ? -1 : 1;
  }
  return 0;
}

/** 한 묶음의 바우처를 `voucherOrder` 순으로(같으면 넣은 순서) */
function sortGroup(items: Voucher[], src: TargetSources): Voucher[] {
  return items
    .map((v) => ({ v, key: voucherOrder(v, src) }))
    .sort((a, b) => compareOrder(a.key, b.key))
    .map(({ v }) => v);
}

/**
 * 묶음 — 항공편 · 숙소 · 일정 · 기타 순, 빈 묶음은 뺀다. 묶음 안은 `voucherOrder` 순(같으면 넣은 순서).
 * 묶은 뒤에 묶음마다 정렬한다 — 묶음끼리는 키 종류가 달라 한꺼번에 정렬하면 순서가 엉킨다.
 * 일정 · 항공편 · 숙소를 아직 못 읽었으면(src null) 넣은 순서
 */
export function groupVouchers(
  list: Voucher[],
  src: TargetSources | null,
): { group: VoucherGroup; items: Voucher[] }[] {
  return VOUCHER_GROUPS.map((group) => {
    const items = list.filter((v) => voucherGroup(v) === group);
    return { group, items: src ? sortGroup(items, src) : items };
  }).filter((g) => g.items.length > 0);
}

/** 줄의 보조 글 — 「{연결 이름} · {첫 번호}」, 둘 다 없으면 「연결된 일정 없음」 */
export function voucherSubText(v: Voucher, targetName: string | null): string {
  const first = voucherNumbers(v)[0]?.value ?? null;
  return [targetName, first].filter(Boolean).join(" · ") || "연결된 일정 없음";
}
