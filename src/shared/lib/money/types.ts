import { CURRENCIES } from "./registry";

/** 100 JPY = 900 KRW  =>  { JPY: { unit: 100, value: 900 } } */
export type ExchangeRates = Record<string, { unit: number; value: number }>;

/** 기준 화폐 · 여행 환율에 고를 수 있는 통화 — 앱이 아는 통화 목록 순서 */
export const CURRENCY_OPTIONS: string[] = CURRENCIES.map((c) => c.code);
