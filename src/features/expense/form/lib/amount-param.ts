/** 주소로 받는 처음 금액 — 정수 1~9자리(키패드 계산기가 만드는 모양) */
const AMOUNT = /^[1-9]\d{0,8}$/;

/**
 * 주소의 amount · currency(여행 홈 환율 계산기의 「이 금액으로 비용 추가」)를 처음 금액 · 통화로.
 * 금액이 정수가 아니거나 통화가 이 여행의 통화가 아니면 undefined(평소처럼 빈 금액)
 */
export function amountFromParam(
  amount: string | null,
  currency: string | null,
  currencies: string[],
): { amount: string; currency: string } | undefined {
  if (!amount || !currency || !AMOUNT.test(amount) || !currencies.includes(currency)) {
    return undefined;
  }
  return { amount, currency };
}
