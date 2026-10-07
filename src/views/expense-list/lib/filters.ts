import {
  type ExpenseCategory,
  type ExpenseWithSplits,
  payerOf,
  type PaymentMethod,
  personKey,
} from "@/entities/expense";

/** PC 목록 필터 — 카테고리 · 결제수단 · 결제한 사람(여럿), 결제 상태(하나), 합계 제외 숨기기 */
export type ExpenseFilters = {
  categories: ExpenseCategory[];
  methods: PaymentMethod[];
  /** 결제한 사람 키(`m:…` · `g:…`). 각자 냄 비용은 결제한 사람이 없어 사람을 고르면 빠진다 */
  payers: string[];
  status: "all" | "done" | "planned";
  hideExcluded: boolean;
};

export const NO_FILTERS: ExpenseFilters = {
  categories: [],
  methods: [],
  payers: [],
  status: "all",
  hideExcluded: false,
};

/** 필터가 하나라도 걸렸는지 — 「필터 결과 · 초기화」 줄을 보인다 */
export function filtersActive(f: ExpenseFilters): boolean {
  return (
    f.categories.length + f.methods.length + f.payers.length > 0 ||
    f.status !== "all" ||
    f.hideExcluded
  );
}

/** 비용 한 줄이 필터에 맞는지 */
export function matchesFilters(e: ExpenseWithSplits, f: ExpenseFilters): boolean {
  const payer = payerOf(e);
  if (f.categories.length && !f.categories.includes(e.category as ExpenseCategory)) return false;
  if (f.methods.length && !f.methods.includes(e.payment_method as PaymentMethod)) return false;
  if (f.payers.length && !(payer && f.payers.includes(personKey(payer)))) return false;
  if (f.status !== "all" && (f.status === "planned") !== !e.paid) return false;
  return !(f.hideExcluded && !e.counted);
}

/** 여럿 고르는 칩의 글 — 안 골랐으면 이름만, 고르면 「카테고리 · 식비 외 1」 */
export function chipLabel(base: string, picked: string[]): string {
  if (picked.length === 0) return base;
  const more = picked.length > 1 ? ` 외 ${picked.length - 1}` : "";
  return `${base} · ${picked[0]}${more}`;
}

/** 결제 상태 칩의 글 */
export const STATUS_LABEL: Record<ExpenseFilters["status"], string> = {
  all: "전체",
  done: "완료만",
  planned: "예정만",
};
