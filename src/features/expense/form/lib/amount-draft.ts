/** 정수 부분 최대 자릿수 — DB 칸 numeric(14,2) 안에 넉넉히 들어가게 */
const MAX_INT_DIGITS = 10;

/**
 * 입력한 글을 금액 초안으로 — 숫자만 남기고(쉼표 · 단위는 버린다), 소수가 있는 통화면 점 하나와 그 통화의 소수 자리까지.
 * 앞의 0 은 뗀다(「0.5」 의 0 은 둔다). 끝의 점은 입력 중이라 그대로 둔다
 */
export function cleanAmount(input: string, decimals: number): string {
  const digits = input.replace(decimals === 0 ? /\D/g : /[^\d.]/g, "");
  const [rawInt = "", ...rest] = digits.split(".");
  const int = rawInt.replace(/^0+(?=\d)/, "").slice(0, MAX_INT_DIGITS);
  if (decimals === 0 || rest.length === 0) return int;
  return `${int || "0"}.${rest.join("").slice(0, decimals)}`;
}

/**
 * 통화를 바꿀 때 초안을 새 통화의 소수 자리에 맞춘다 — 소수부를 자른다(「12.5」 달러 → 엔이면 「12」).
 * 타자용 `cleanAmount` 에 넘기면 정수 통화에서 점을 지우고 숫자를 이어 붙여 「125」 가 된다
 */
export function fitAmountDraft(draft: string, decimals: number): string {
  const [int, fraction] = draft.split(".");
  if (fraction === undefined) return int;
  return decimals === 0 ? int : `${int}.${fraction.slice(0, decimals)}`;
}

/** 초안에 천 단위 쉼표를 넣는다 — 「12000.5」 → 「12,000.5」 */
export function formatAmountDraft(draft: string): string {
  const [int, fraction] = draft.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}
