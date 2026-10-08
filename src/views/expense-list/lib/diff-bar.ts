/** 정산 차액 막대(P37) 한 줄 — 받을 돈(오른쪽) · 보낼 돈(왼쪽) · 정산 없음 */
export type DiffBar = {
  side: "receive" | "send" | "none";
  /** 결제한 돈 − 쓴 돈. 받을 돈이면 양수 */
  net: number;
  /** 막대 왼쪽 끝 · 길이(트랙 폭 %). 가운데(50%)가 0 */
  left: number;
  width: number;
};

/** 이보다 작은 차액은 정산 없음 — 나누기에서 생긴 1원 아래 끝수 */
const EPSILON = 1;
/** 막대 최소 길이(%) — 아주 작은 차액도 보이게 */
const MIN_WIDTH = 0.6;

/**
 * 사람마다 차액 막대 — 길이 = |차액| ÷ 가장 큰 |차액| × 50%(최소 0.6%). 가장 큰 차액이 반폭.
 * 송금 기록은 빼지 않는다(막대 아래 「쓴 돈 · 결제」 와 같은 기준). 남은 송금은 아래 목록이 보인다
 */
export function diffBars(people: { spent: number; paid: number }[]): DiffBar[] {
  const nets = people.map((p) => p.paid - p.spent);
  const max = Math.max(0, ...nets.map(Math.abs));
  return nets.map((net) => {
    if (Math.abs(net) < EPSILON || max === 0) return { side: "none", net, left: 50, width: 0 };
    const width = Math.max(MIN_WIDTH, (Math.abs(net) / max) * 50);
    return net > 0
      ? { side: "receive", net, left: 50, width }
      : { side: "send", net, left: 50 - width, width };
  });
}
