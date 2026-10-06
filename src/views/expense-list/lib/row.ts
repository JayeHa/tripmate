import {
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategory,
  type ExpenseWithSplits,
  payerOf,
  type PersonRef,
  splitPerson,
  toHomeFor,
} from "@/entities/expense";
import {
  decimalsOf,
  type ExchangeRates,
  formatMoney,
  MissingRateError,
  roundTo,
} from "@/shared/lib/money";

/** 목록 한 줄에 보이는 글 */
export type ExpenseRowView = {
  id: string;
  name: string;
  category: ExpenseCategory;
  categoryLabel: string;
  /** 쓴 통화 그대로 — 「¥3,200」 */
  amountText: string;
  /** 외화면 기준 화폐 근사치 「≈ ₩29,440」, 환율이 없으면 「환율 없음」. 기준 화폐면 null */
  approxText: string | null;
  /** 외화면 쓴 환율 「(¥100 = ₩920)」. 기준 화폐 · 환율 없음이면 null */
  rateText: string | null;
  /** 결제한 사람. 「각자 냄」 이면 null */
  payer: { person: PersonRef; name: string } | null;
  /** 함께한 사람 — 아바타용 사람 · 이름, 글로 이은 것 */
  togetherPeople: { person: PersonRef; name: string }[];
  together: string;
  /** 각자 자기 몫을 낸 비용 — 결제한 사람 대신 「각자 냄」 */
  splitEach: boolean;
  planned: boolean;
  /** 결제 예정인데 예정일이 지났다 */
  overdue: boolean;
  /** 합계에서 뺐다 */
  excluded: boolean;
  /** 연결한 일정 이름 */
  linkName: string | null;
};

type RowContext = {
  home: string;
  rates: ExchangeRates;
  /** yyyy-MM-dd */
  today: string;
  /** 사람 이름 — 나는 「나」 */
  nameOf: (person: PersonRef) => string;
  /** 연결한 일정의 이름. 일정이 없어졌거나 아직 못 읽었으면 null */
  linkNameOf: (itemId: string) => string | null;
};

/** 외화 지출의 근사치 · 환율 글. 기준 화폐면 둘 다 null */
function foreignTexts(e: ExpenseWithSplits, ctx: RowContext) {
  if (e.currency === ctx.home) return { approxText: null, rateText: null };
  try {
    const home = toHomeFor(e, Number(e.amount), ctx.home, ctx.rates);
    const unit = ctx.rates[e.currency]?.unit ?? 1;
    const value = toHomeFor(e, unit, ctx.home, ctx.rates);
    return {
      approxText: `≈ ${formatMoney(roundTo(home, decimalsOf(ctx.home)), ctx.home)}`,
      rateText: `(${formatMoney(unit, e.currency)} = ${formatMoney(value, ctx.home)})`,
    };
  } catch (err) {
    if (!(err instanceof MissingRateError)) throw err;
    return { approxText: "환율 없음", rateText: null };
  }
}

/** 함께한 사람 — 나눈 순서대로 */
function togetherOf(e: ExpenseWithSplits, ctx: RowContext) {
  const togetherPeople = e.splits.flatMap((s) => {
    const person = splitPerson(s);
    return person ? [{ person, name: ctx.nameOf(person) }] : [];
  });
  return { togetherPeople, together: togetherPeople.map((p) => p.name).join(", ") };
}

/** 결제한 사람. 「각자 냄」 이면 null */
function payerViewOf(e: ExpenseWithSplits, ctx: RowContext) {
  const person = payerOf(e);
  return person ? { person, name: ctx.nameOf(person) } : null;
}

/** 지출 한 줄을 목록에 보일 글로 */
export function expenseRowView(e: ExpenseWithSplits, ctx: RowContext): ExpenseRowView {
  const category = e.category as ExpenseCategory;
  return {
    id: e.id,
    name: e.name,
    category,
    categoryLabel: EXPENSE_CATEGORY_LABEL[category] ?? "기타",
    amountText: formatMoney(Number(e.amount), e.currency),
    ...foreignTexts(e, ctx),
    payer: payerViewOf(e, ctx),
    ...togetherOf(e, ctx),
    splitEach: e.split_each,
    planned: !e.paid,
    overdue: !e.paid && e.due_date !== null && e.due_date < ctx.today,
    excluded: !e.counted,
    linkName: e.schedule_item_id ? ctx.linkNameOf(e.schedule_item_id) : null,
  };
}
