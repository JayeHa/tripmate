import { personOfKey } from "@/entities/expense";

/**
 * 이 폼을 연 뒤 목록에서 **사라진** 정산 인원인지 — 본 적 있는(`seen`) 인원이 지금 목록(`everyone`)에 없다.
 * 처음부터 목록에 없던 키(기기에 저장된 옛 목록이라 늦게 안 인원 · 옛 기록)는 빠진 것으로 보지 않는다
 */
function goneGuest(key: string, everyone: string[], seen: ReadonlySet<string>) {
  return personOfKey(key)?.kind === "guest" && seen.has(key) && !everyone.includes(key);
}

/** 고른 함께한 사람 중 그사이 빠진 정산 인원을 뺀다. 다 빠지면 나만 */
export function liveParticipants(
  picked: string[],
  everyone: string[],
  seen: ReadonlySet<string>,
  me: string,
): string[] {
  const live = picked.filter((key) => !goneGuest(key, everyone, seen));
  return live.length > 0 ? live : [me];
}

/** 고른 결제자가 그사이 빠진 정산 인원이면 나 */
export function livePayer(
  payer: string | null,
  everyone: string[],
  seen: ReadonlySet<string>,
  me: string,
): string | null {
  return payer !== null && goneGuest(payer, everyone, seen) ? me : payer;
}
