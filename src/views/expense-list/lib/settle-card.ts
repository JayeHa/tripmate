import { type PersonKey, personKey, type PersonRef, type Transfer } from "@/entities/expense";

/** 대시보드 정산 카드에 보이는 사람 줄 수 · 내 송금 줄 수 — 인원이 많아도 카드 높이가 여기서 멈춘다 */
const PEOPLE_MAX = 3;
const MINE_MAX = 2;

type CardPerson = { person: PersonRef; spent: number; paid: number };

/** 송금 줄 아래 회색 한 줄 — 보이지 않은 송금 요약. 없으면 null */
export type SettleRest = { text: string; mineDone: boolean } | null;

/**
 * 대시보드 정산 카드(P37)의 내용.
 * - 사람: (나) 맨 위 + 차액(|결제 − 쓴 돈|) 큰 순으로 모두 3줄까지, 나머지는 「외 N명」 으로
 * - 송금: 나와 주고받는 남은 송금 2건까지(받을 것 먼저), 나머지는 회색 줄 「외 N건 · 내 송금 a건 + 일행끼리 b건」.
 *   내 송금이 없으면 「내 정산은 끝났어요 · 일행 정산 N건 남음」
 * - 남은 송금이 없으면 none — 보낸 기록이 있으면 「모두 정산됐어요」, 없으면 「각자 낸 만큼 썼어요 · 정산할 금액이 없어요」.
 *   보낸 송금(완료)은 카드에 보이지 않는다(상세에서 회색 빗금)
 */
export function settleCardView<P extends CardPerson>(
  people: P[],
  remaining: Transfer[],
  me: PersonKey | null,
  anySent: boolean,
) {
  const self = people.find((p) => personKey(p.person) === me);
  const gap = (p: P) => Math.abs(p.paid - p.spent);
  // 안정 정렬 — 차액이 같으면 원래 순서(멤버 먼저)
  const others = people.filter((p) => p !== self).sort((a, b) => gap(b) - gap(a));
  const room = self ? PEOPLE_MAX - 1 : PEOPLE_MAX;
  const isMine = (t: Transfer) => me !== null && (t.from === me || t.to === me);
  const mine = remaining.filter(isMine).sort((a, b) => Number(b.to === me) - Number(a.to === me));
  const theirs = remaining.length - mine.length;
  return {
    shown: self ? [self, ...others.slice(0, room)] : others.slice(0, room),
    hidden: others.slice(room),
    mine: mine.slice(0, MINE_MAX),
    mineCount: mine.length,
    rest: restLine(mine.length, theirs),
    none: remaining.length > 0 ? null : noneText(anySent),
  };
}

/** 남은 송금이 없을 때의 한 줄 — 보낸 기록이 있으면 다 끝난 것, 없으면 처음부터 정산할 것이 없다 */
function noneText(anySent: boolean): string {
  return anySent ? "모두 정산됐어요" : "각자 낸 만큼 썼어요 · 정산할 금액이 없어요";
}

/** 회색 한 줄의 글 — 보이지 않은 내 송금 · 일행끼리 송금 */
function restLine(mine: number, theirs: number): SettleRest {
  if (mine === 0) {
    return theirs > 0
      ? { text: `내 정산은 끝났어요 · 일행 정산 ${theirs}건 남음`, mineDone: true }
      : null;
  }
  const extra = Math.max(0, mine - MINE_MAX);
  if (extra + theirs === 0) return null;
  return { text: `외 ${extra + theirs}건 · ${restDetail(extra, theirs)}`, mineDone: false };
}

/** 「외 N건」 뒤 — 둘 다 있으면 나눠 세고, 한쪽뿐이면 그 이름만 */
function restDetail(extra: number, theirs: number): string {
  if (extra > 0 && theirs > 0) return `내 송금 ${extra}건 + 일행끼리 ${theirs}건`;
  return extra > 0 ? "내 송금" : "일행끼리";
}
