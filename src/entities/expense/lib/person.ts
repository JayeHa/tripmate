import type { ExpenseSplit, ExpenseWithSplits, TripGuest } from "../model/types";

/** 가계부에 나오는 사람 — 여행 멤버이거나, 초대 없이 넣은 정산 인원 */
export type PersonRef = { kind: "member"; id: string } | { kind: "guest"; id: string };

/** 사람을 Record 의 키로 쓸 글 — 멤버와 인원의 id 가 겹치지 않게 종류를 앞에 붙인다 */
export type PersonKey = string;

/** 사람 → 키 */
export function personKey(person: PersonRef): PersonKey {
  return `${person.kind === "member" ? "m" : "g"}:${person.id}`;
}

/** 키 → 사람. 모양이 아니면 null */
export function personOfKey(key: PersonKey): PersonRef | null {
  const kind = key.slice(0, 1);
  const id = key.slice(2);
  if (!id || key.slice(1, 2) !== ":" || (kind !== "m" && kind !== "g")) return null;
  return { kind: kind === "m" ? "member" : "guest", id };
}

/** 비용을 결제한 사람. 「각자 냄」 이면 null */
export function payerOf(
  e: Pick<ExpenseWithSplits, "payer_id" | "payer_guest_id">,
): PersonRef | null {
  if (e.payer_id) return { kind: "member", id: e.payer_id };
  if (e.payer_guest_id) return { kind: "guest", id: e.payer_guest_id };
  return null;
}

/** 나눠 낸 한 사람. 두 칸 중 하나는 반드시 차 있다(DB check) — 둘 다 비면 null */
export function splitPerson(s: Pick<ExpenseSplit, "user_id" | "guest_id">): PersonRef | null {
  if (s.user_id) return { kind: "member", id: s.user_id };
  if (s.guest_id) return { kind: "guest", id: s.guest_id };
  return null;
}

/** 멤버 id 목록과 정산 인원을 가계부에 나오는 사람 목록으로 — 멤버 먼저 */
export function peopleOf(memberIds: string[], guests: Pick<TripGuest, "id">[]): PersonRef[] {
  return [
    ...memberIds.map((id): PersonRef => ({ kind: "member", id })),
    ...guests.map((g): PersonRef => ({ kind: "guest", id: g.id })),
  ];
}
