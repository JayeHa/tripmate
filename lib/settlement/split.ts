import { decimalsOf } from "./currency";

export type Share = { userId: string; share: number };

/**
 * 균등 분배. 최소 단위(원/엔/센트)로 나눈 뒤 나머지를 앞쪽 참가자에게 1단위씩 배분.
 * 참가자는 userId 기준 정렬해 결정적으로 배분.
 */
export function splitEqual(amount: number, currency: string, participantIds: string[]): Share[] {
  const ids = [...new Set(participantIds)].sort();
  if (ids.length === 0) throw new Error("참가자가 없습니다");
  const f = 10 ** decimalsOf(currency);
  const total = Math.round(amount * f);
  const base = Math.floor(total / ids.length);
  const rem = total - base * ids.length;
  return ids.map((userId, i) => ({ userId, share: (base + (i < rem ? 1 : 0)) / f }));
}

export type CustomSharesResult = { ok: true; shares: Share[] } | { ok: false; error: string };

/** 커스텀 분배 검증: 음수 없음, 합계 = 금액(최소 단위 반올림 오차 허용) */
export function validateCustomShares(
  amount: number,
  currency: string,
  shares: Share[],
): CustomSharesResult {
  if (shares.length === 0) return { ok: false, error: "참가자가 없습니다" };
  if (shares.some((s) => s.share < 0)) return { ok: false, error: "음수 금액은 허용되지 않습니다" };
  const f = 10 ** decimalsOf(currency);
  const sum = shares.reduce((acc, s) => acc + Math.round(s.share * f), 0);
  const total = Math.round(amount * f);
  if (sum !== total) {
    const diff = (total - sum) / f;
    return {
      ok: false,
      error: diff > 0 ? `${diff} 만큼 부족합니다` : `${-diff} 만큼 초과했습니다`,
    };
  }
  return { ok: true, shares };
}
