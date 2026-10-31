import {
  type ExpenseCategory,
  type ExpenseWithSplits,
  payerOf,
  type PaymentMethod,
  personKey,
  splitPerson,
} from "@/entities/expense";

/**
 * PC 목록 필터 — 밖: 카테고리 · 결제한 사람 · 결제수단(여럿). 「필터 더보기」: 결제 통화(하나) · 함께한 사람(여럿) ·
 * 결제 상태(하나) · 합계 제외 숨기기
 */
export type ExpenseFilters = {
  categories: ExpenseCategory[];
  methods: PaymentMethod[];
  /** 결제한 사람 키(`m:…` · `g:…`). 각자 냄 비용은 결제한 사람이 없어 사람을 고르면 빠진다 */
  payers: string[];
  /** 결제 통화 — 「전체」 면 "all" */
  currency: string;
  /** 함께한 사람 키 — 고른 사람 중 한 명이라도 함께했으면 통과 */
  together: string[];
  status: "all" | "done" | "planned";
  hideExcluded: boolean;
};

export const NO_FILTERS: ExpenseFilters = {
  categories: [],
  methods: [],
  payers: [],
  currency: "all",
  together: [],
  status: "all",
  hideExcluded: false,
};

/** 「필터 더보기」 안에서 걸린 필터 수 — 버튼의 「· N」 */
export function moreCount(f: ExpenseFilters): number {
  return [f.currency !== "all", f.together.length > 0, f.status !== "all", f.hideExcluded].filter(
    Boolean,
  ).length;
}

/** 필터가 하나라도 걸렸는지 — 「필터 결과 · 초기화」 줄을 보인다 */
export function filtersActive(f: ExpenseFilters): boolean {
  return f.categories.length + f.methods.length + f.payers.length > 0 || moreCount(f) > 0;
}

/** 함께한 사람 키 */
function togetherKeys(e: ExpenseWithSplits): string[] {
  return e.splits.flatMap((s) => {
    const person = splitPerson(s);
    return person ? [personKey(person)] : [];
  });
}

/** 비용 한 줄이 필터에 맞는지 */
export function matchesFilters(e: ExpenseWithSplits, f: ExpenseFilters): boolean {
  const payer = payerOf(e);
  if (f.categories.length && !f.categories.includes(e.category as ExpenseCategory)) return false;
  if (f.methods.length && !f.methods.includes(e.payment_method as PaymentMethod)) return false;
  if (f.payers.length && !(payer && f.payers.includes(personKey(payer)))) return false;
  if (f.currency !== "all" && e.currency !== f.currency) return false;
  if (f.together.length && !togetherKeys(e).some((k) => f.together.includes(k))) return false;
  if (f.status !== "all" && (f.status === "planned") !== !e.paid) return false;
  return !(f.hideExcluded && !e.counted);
}

/** 「필터 더보기」 에 보일 묶음 — 걸 거리가 있을 때만 */
export type MoreGroups = {
  /** 쓴 통화(쓴 순서). 2개 이상 썼을 때만, 아니면 null */
  currencies: string[] | null;
  /** 일행이 있다 */
  together: boolean;
  /** 결제 예정 비용이 있다 */
  status: boolean;
  /** 합계에서 뺀 비용이 있다 */
  excluded: boolean;
};

/**
 * 여행 전체 비용으로 「필터 더보기」 묶음을 정한다(필터로 거른 결과가 아니라).
 * 이미 걸어 둔 필터의 묶음은 걸 거리가 없어져도 남긴다 — 마지막 결제 예정을 처리하거나 그 통화 비용을 지우면
 * 묶음이 사라져 패널에서 풀 수 없게 된다. 걸린 통화가 더는 쓰이지 않아도 그 칩을 남긴다
 */
export function moreGroups(
  expenses: ExpenseWithSplits[],
  solo: boolean,
  f: ExpenseFilters,
): MoreGroups {
  const used = [...new Set(expenses.map((e) => e.currency))];
  const currencies =
    f.currency === "all" || used.includes(f.currency) ? used : [...used, f.currency];
  return {
    currencies: currencies.length > 1 || f.currency !== "all" ? currencies : null,
    together: !solo || f.together.length > 0,
    status: expenses.some((e) => !e.paid) || f.status !== "all",
    excluded: expenses.some((e) => !e.counted) || f.hideExcluded,
  };
}

/** 모바일 「결제한 사람」 칩 — 그 사람이 결제한 비용만 남기는 조건(각자 냄은 결제한 사람이 없어 빠진다). null 이면 거르지 않는다 */
export function byPayer(key: string | null): ((e: ExpenseWithSplits) => boolean) | undefined {
  if (key === null) return undefined;
  const filters = { ...NO_FILTERS, payers: [key] };
  return (e) => matchesFilters(e, filters);
}
