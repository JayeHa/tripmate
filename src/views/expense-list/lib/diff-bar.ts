/** 정산 차액 막대(P37) 한 줄 — 받을 돈(오른쪽) · 보낼 돈(왼쪽) · 정산 없음 */
export type DiffBar = {
  side: "receive" | "send" | "none";
  /** 남은 차액(결제한 돈 − 쓴 돈에서 이미 주고받은 송금을 뺀 값). 받을 돈이면 양수 */
  net: number;
  /** 막대 왼쪽 끝 · 길이(트랙 폭 %). 가운데(50%)가 0 */
  left: number;
  width: number;
};

/** 막대 최소 길이(%) — 아주 작은 차액도 보이게 */
const MIN_WIDTH = 0.6;

/**
 * 사람마다 차액 막대 — 길이 = |차액| ÷ 가장 큰 |차액| × 50%(최소 0.6%). 가장 큰 차액이 반폭.
 * 차액은 송금 기록을 뺀 남은 차액(`settle.people[].net`) — 사람 상세의 받을 돈 · 보낼 돈 · 남은 송금과 같은 금액이라,
 * 「받았어요」 로 표시한 정산은 막대에서도 줄어든다. 막대 아래 「쓴 돈 · 결제」 는 원래 값 그대로 보인다
 */
export function diffBars(nets: number[], decimals: number): DiffBar[] {
  // 최소 단위의 절반보다 작은 차액은 정산 없음(원 0.5 · 달러 0.005) — 사람 상세 · 송금 계산과 같은 기준
  const eps = 0.5 / 10 ** decimals;
  const max = Math.max(0, ...nets.map(Math.abs));
  return nets.map((net) => {
    if (Math.abs(net) <= eps || max === 0) return { side: "none", net, left: 50, width: 0 };
    const width = Math.max(MIN_WIDTH, (Math.abs(net) / max) * 50);
    return net > 0
      ? { side: "receive", net, left: 50, width }
      : { side: "send", net, left: 50 - width, width };
  });
}
