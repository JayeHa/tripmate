import type { FareDraft, TransportFare } from "../model/types";

/** 통화 하나의 합계 */
export type FareTotal = { currency: string; amount: number };

/** 그날 줄 — 없으면 null */
export function dayFare(fares: TransportFare[], dayIndex: number): TransportFare | null {
  return fares.find((f) => f.day_index === dayIndex) ?? null;
}

/** 날짜 밖 줄(공항 왕복 · 패스) — 넣은 순 */
export function extraFares(fares: TransportFare[]): TransportFare[] {
  return fares.filter((f) => f.day_index === null);
}

/**
 * 1인 합계 — 통화마다, 처음 나온 순서대로. 기간 밖 날짜 줄(기간을 줄여 보이지 않는 줄)과 금액 없는 줄은 빼고,
 * 날짜 밖 줄은 넣는다. 금액이 하나도 없으면 빈 목록
 */
export function fareTotals(fares: TransportFare[], totalDays: number): FareTotal[] {
  const sums = new Map<string, number>();
  for (const f of fares) {
    if (f.amount === null) continue;
    if (f.day_index !== null && f.day_index >= totalDays) continue;
    sums.set(f.currency, (sums.get(f.currency) ?? 0) + Number(f.amount));
  }
  return [...sums].map(([currency, amount]) => ({ currency, amount }));
}

/** 적은 값을 저장할 모양으로 — 메모는 앞뒤 공백을 떼고 비면 null */
export function cleanDraft(draft: FareDraft): FareDraft {
  return { ...draft, memo: draft.memo?.trim() || null };
}

/** 금액도 메모도 없는가 — 날짜 줄이면 저장 대신 지운다 */
export function isEmptyDraft(draft: FareDraft): boolean {
  return draft.amount === null && !draft.memo?.trim();
}
