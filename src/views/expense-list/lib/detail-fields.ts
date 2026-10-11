import {
  detailDateText,
  type ExpenseRowView,
  type ExpenseWithSplits,
  type PersonRef,
  toHomeFor,
  withLine,
} from "@/entities/expense";
import {
  decimalsOf,
  type ExchangeRates,
  formatMoney,
  MissingRateError,
  roundTo,
} from "@/shared/lib/money";

/** 상세 패널 한 줄. muted 면 값이 비어 있다는 뜻(「연결 안 함」 · 「없음」) — 흐리게 */
export type DetailField = { label: string; value: string; muted?: boolean };

type FieldContext = {
  trip: {
    start_date: string;
    end_date: string;
    home_currency: string;
    exchange_rates: ExchangeRates;
  };
  displayNameOf: (person: PersonRef) => string;
  /** 여행의 사람 수 — 「N명 모두」 */
  everyone: number;
  /** 나 — 결제한 사람 뒤 「(나)」. 아직 모르면 null */
  meId: string | null;
};

/**
 * 「 · 1인 ₩9,813」 — 둘 이상이 똑같이 나눴을 때 기준 화폐로 한 사람 몫. 환율이 없으면 빈 글.
 * 직접 나눈(custom) 옛 지출은 사람마다 몫이 달라 「1인」 이 맞는 사람이 없어서 보이지 않는다
 */
function perPersonText(e: ExpenseWithSplits, count: number, ctx: FieldContext): string {
  if (count < 2 || e.split_mode === "custom") return "";
  const home = ctx.trip.home_currency;
  try {
    const each = toHomeFor(e, Number(e.amount), home, ctx.trip.exchange_rates) / count;
    return ` · 1인 ${formatMoney(roundTo(each, decimalsOf(home)), home)}`;
  } catch (err) {
    if (err instanceof MissingRateError) return "";
    throw err;
  }
}

/** 「결제」 줄 — 각자 냄, 아니면 결제한 사람(나면 「정원 (나)」) */
function payerText(row: ExpenseRowView, ctx: FieldContext): string {
  if (row.splitEach || !row.payer) return "각자 냄";
  const { person } = row.payer;
  const me = person.kind === "member" && person.id === ctx.meId;
  return `${ctx.displayNameOf(person)}${me ? " (나)" : ""}`;
}

/** PC 비용 상세 패널의 표 — 날짜 · 카테고리 · 결제수단 · 결제 · 함께 · 일정 · 메모. 빈 일정 · 메모도 줄은 둔다 */
export function detailFields(
  e: ExpenseWithSplits,
  row: ExpenseRowView,
  ctx: FieldContext,
): DetailField[] {
  const memo = e.memo?.trim();
  return [
    { label: "날짜", value: detailDateText(e.spent_on, ctx.trip) },
    { label: "카테고리", value: row.categoryLabel },
    { label: "결제수단", value: row.methodLabel },
    { label: "결제", value: payerText(row, ctx) },
    {
      label: "함께",
      value: `${withLine(row, ctx.displayNameOf, ctx.everyone)}${perPersonText(e, row.togetherPeople.length, ctx)}`,
    },
    row.fromStay
      ? { label: "연결", value: "숙소 정보" }
      : { label: "일정", value: row.linkName ?? "연결 안 함", muted: !row.linkName },
    { label: "메모", value: memo || "없음", muted: !memo },
  ];
}
