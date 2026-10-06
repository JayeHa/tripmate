/** 정수 부분 최대 자릿수 — DB 칸 numeric(14,2) 안에 넉넉히 들어가게 */
const MAX_INT_DIGITS = 10;

/**
 * 입력한 글을 금액 초안으로 — 숫자만 남기고(쉼표 · 단위는 버린다), 소수가 있는 통화면 점 하나와 그 통화의 소수 자리까지.
 * 소수가 없는 통화(원 · 엔)는 첫 점 뒤를 버린다 — 「1,234.56」 을 붙여 넣어도 123456 이 아니라 1234.
 * 앞의 0 은 뗀다(「0.5」 의 0 은 둔다). 끝의 점은 입력 중이라 그대로 둔다
 */
export function cleanAmount(input: string, decimals: number): string {
  const [rawInt = "", ...rest] = input.replace(/[^\d.]/g, "").split(".");
  const int = rawInt.replace(/^0+(?=\d)/, "").slice(0, MAX_INT_DIGITS);
  if (decimals === 0 || rest.length === 0) return int;
  return `${int || "0"}.${rest.join("").slice(0, decimals)}`;
}

/**
 * 통화를 바꿀 때 초안을 새 통화의 소수 자리에 맞춘다 — 소수부를 자른다(「12.5」 달러 → 엔이면 「12」)
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

/** 커서 앞에 있는 숫자 · 점의 수 — 쉼표를 다시 넣은 뒤에도 같은 자리로 커서를 돌려놓으려고 센다 */
export function digitsBefore(text: string, caret: number): number {
  return text.slice(0, caret).replace(/[^\d.]/g, "").length;
}

/** 쉼표를 넣은 글에서 숫자 · 점이 `count` 개 지난 자리. 모자라면 끝 */
export function caretAfter(formatted: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/[\d.]/.test(formatted[i])) seen++;
    if (seen === count) return i + 1;
  }
  return formatted.length;
}
