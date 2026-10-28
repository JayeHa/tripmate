import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  ExpenseCategoryIcon,
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHODS,
  PersonAvatar,
  personKey,
} from "@/entities/expense";
import type { FilterOption } from "@/shared/ui/filter-select";

import type { ExpenseList } from "../../model/use-expense-list";
import type { TogetherOption } from "./more-filters";

const CATEGORY_OPTIONS: FilterOption[] = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: EXPENSE_CATEGORY_LABEL[c],
  icon: <ExpenseCategoryIcon category={c} className="size-4" />,
}));

const METHOD_OPTIONS: FilterOption[] = PAYMENT_METHODS.map((m) => ({
  value: m,
  label: PAYMENT_METHOD_LABEL[m],
}));

/**
 * PC 필터 줄의 고를 거리 — 카테고리(아이콘 16) · 결제수단 · 사람(목록 아바타 24, 칩에는 흰 1.5 링 18).
 * 사람은 여행의 멤버 + 정산 인원, 이름은 「나」 가 아니라 내 이름
 */
export function filterOptions(list: ExpenseList): {
  categories: FilterOption[];
  methods: FilterOption[];
  payers: FilterOption[];
  people: TogetherOption[];
} {
  const people = list.people.map((p) => {
    const a = list.avatarOf(p);
    const label = list.displayNameOf(p);
    /** 크기만 다른 아바타 */
    const avatar = (className: string) => (
      <PersonAvatar guest={p.kind === "guest"} name={label} url={a.url} className={className} />
    );
    return { value: personKey(p), label, avatar };
  });
  return {
    categories: CATEGORY_OPTIONS,
    methods: METHOD_OPTIONS,
    payers: people.map((p) => ({
      value: p.value,
      label: p.label,
      icon: p.avatar("size-6"),
      chipIcon: p.avatar("size-4.5 ring-[1.5px] ring-white"),
    })),
    people: people.map((p) => ({ value: p.value, label: p.label, avatar: p.avatar("size-5") })),
  };
}
