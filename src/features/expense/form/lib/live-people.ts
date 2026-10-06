import { personOfKey } from "@/entities/expense";

/** 정산 인원(guest) 키인데 지금 사람 목록에 없다 — 그사이 일행이 뺐다 */
function goneGuest(key: string, everyone: string[]) {
  return personOfKey(key)?.kind === "guest" && !everyone.includes(key);
}

/**
 * 고른 함께한 사람 중 그사이 빠진 정산 인원을 뺀다. 다 빠지면 나만.
 * 멤버 키는 목록에 없어도 남긴다 — 여행을 떠난 멤버의 옛 기록은 지우지 않는다(DB 도 받는다)
 */
export function liveParticipants(picked: string[], everyone: string[], me: string): string[] {
  const live = picked.filter((key) => !goneGuest(key, everyone));
  return live.length > 0 ? live : [me];
}

/** 고른 결제자가 그사이 빠진 정산 인원이면 나 */
export function livePayer(payer: string | null, everyone: string[], me: string): string | null {
  return payer !== null && goneGuest(payer, everyone) ? me : payer;
}
