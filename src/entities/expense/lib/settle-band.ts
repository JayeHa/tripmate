import type { PersonKey } from "./person";
import type { Transfer } from "./settle";

/**
 * 정산 띠의 상태 — 내 입장에서 본 정산 한 줄.
 * - recv: 내가 받을 돈이 있다(누구에게서 · 합계)
 * - send: 내가 보낼 돈이 있다
 * - done: 나는 끝났다. `pending` 은 일행끼리 남은 송금 수(0 이면 「모두 정산됐어요」)
 * - none: 나눠 낸 비용이 아직 없다
 *
 * 받을 돈과 보낼 돈은 사람마다 합쳐 계산돼서(minimizeTransfers) 한 사람에게 동시에 생기지 않는다
 */
export type SettleBandState =
  | { kind: "recv"; people: PersonKey[]; amount: number }
  | { kind: "send"; people: PersonKey[]; amount: number }
  | { kind: "done"; pending: number }
  | { kind: "none" };

/**
 * 남은 송금(이미 보낸 돈을 뺀 뒤)과 나(`me`)로 띠 상태를 정한다.
 * `shared` 는 둘 이상이 나눠 낸 비용이 하나라도 있는지 — 없으면 정산할 것이 없다(none)
 */
export function settleBandState(
  transfers: Transfer[],
  me: PersonKey,
  shared: boolean,
): SettleBandState {
  const toMe = transfers.filter((t) => t.to === me);
  if (toMe.length > 0) {
    return { kind: "recv", people: toMe.map((t) => t.from), amount: sum(toMe) };
  }
  const fromMe = transfers.filter((t) => t.from === me);
  if (fromMe.length > 0) {
    return { kind: "send", people: fromMe.map((t) => t.to), amount: sum(fromMe) };
  }
  if (!shared) return { kind: "none" };
  return { kind: "done", pending: transfers.length };
}

/** 송금 금액 합 */
function sum(list: Transfer[]): number {
  return list.reduce((n, t) => n + t.amount, 0);
}
