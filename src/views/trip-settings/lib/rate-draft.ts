import {
  CURRENCY_OPTIONS,
  defaultRate,
  displayRateValue,
  type ExchangeRates,
} from "@/shared/lib/money";

/** 환율 창의 한 줄 — 입력 중인 글자 그대로. id 는 React key(중간 줄을 빼도 다른 줄 입력이 섞이지 않게) */
export type RateDraft = { id: string; code: string; unit: string; value: string };

/** 저장할 것 — 바꾸거나 더한 통화와 뺀 통화. 둘 다 비면 바뀐 것이 없다 */
export type RateChanges = { set: ExchangeRates; remove: string[] };

/** 검사 결과 — 막는 이유가 있으면 error */
export type RateCheck = { changes: RateChanges; error: string | null };

/** 저장값을 입력 글자로 — 기준 화폐를 바꿨다 되돌린 반올림 끝자리는 보이지 않게 */
function toDraft(id: string, code: string, rate: { unit: number; value: number }): RateDraft {
  return { id, code, unit: String(rate.unit), value: String(displayRateValue(rate.value)) };
}

/**
 * 창을 열 때의 줄 — 지금 여행 환율. 여행지 통화(첫 도시)가 기준 화폐와 다른데 여행 환율에 없으면
 * 대략 값(고정 표)을 채운 줄을 맨 위에 둔다(#251). 저장해야 들어간다
 */
export function initialDrafts(
  rates: ExchangeRates,
  home: string,
  destination: string | null,
  makeId: () => string,
): RateDraft[] {
  const rows = Object.entries(rates).map(([code, r]) => toDraft(makeId(), code, r));
  if (!destination || destination === home || destination in rates) return rows;
  const guess = defaultRate(destination, home);
  return guess ? [toDraft(makeId(), destination, guess), ...rows] : rows;
}

/** 「+ 추가」 — 기준 화폐 · 이미 있는 통화가 아닌 첫 통화와 그 대략 값. 더 고를 통화가 없으면 null */
export function newDraft(
  drafts: RateDraft[],
  home: string,
  makeId: () => string,
): RateDraft | null {
  const used = new Set([home, ...drafts.map((d) => d.code)]);
  const code = CURRENCY_OPTIONS.find((c) => !used.has(c));
  if (!code) return null;
  const guess = defaultRate(code, home);
  return guess ? toDraft(makeId(), code, guess) : { id: makeId(), code, unit: "1", value: "" };
}

/** 입력 글자 → 양수. 쉼표는 지운다. 아니면 null */
function positive(text: string): number | null {
  const n = Number(text.replace(/,/g, "").trim());
  return text.trim() !== "" && Number.isFinite(n) && n > 0 ? n : null;
}

/** 저장값과 같은가 — 처음 보인 글자(반올림한 값)를 그대로 두었으면 같다 */
function sameRate(saved: { unit: number; value: number } | undefined, unit: number, value: number) {
  return saved !== undefined && saved.unit === unit && displayRateValue(saved.value) === value;
}

/**
 * 저장할 것과 막는 이유 — 칸이 비었거나 0 이하, 같은 통화가 두 줄이면 막는다.
 * 저장값과 같은 줄은 보내지 않는다(그사이 일행이 고친 값을 덮지 않게). 저장값에 있는데 줄이 없으면 뺀다
 */
export function checkRates(saved: ExchangeRates, drafts: RateDraft[]): RateCheck {
  const set: ExchangeRates = {};
  const codes = new Set<string>();
  let error: string | null = null;
  for (const d of drafts) {
    if (codes.has(d.code)) error ??= `${d.code} 가 두 줄이에요. 한 줄은 빼 주세요.`;
    codes.add(d.code);
    const unit = positive(d.unit);
    const value = positive(d.value);
    if (unit === null || value === null) {
      error ??= "환율은 0보다 큰 숫자로 넣어 주세요.";
      continue;
    }
    if (!sameRate(saved[d.code], unit, value)) set[d.code] = { unit, value };
  }
  const remove = Object.keys(saved).filter((code) => !codes.has(code));
  return { changes: { set, remove }, error };
}

/** 바뀐 것이 있는가 */
export function hasChanges(changes: RateChanges): boolean {
  return Object.keys(changes.set).length > 0 || changes.remove.length > 0;
}

/** 뺄 통화 중 지출이 쓰는 것과 건수 — 「USD 지출 2건이 합계에서 빠져요」 */
export function removedInUse(
  remove: string[],
  expenses: { currency: string }[],
): { code: string; count: number }[] {
  return remove
    .map((code) => ({ code, count: expenses.filter((e) => e.currency === code).length }))
    .filter((r) => r.count > 0);
}
