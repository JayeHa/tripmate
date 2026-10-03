/** 100 JPY = 900 KRW  =>  { JPY: { unit: 100, value: 900 } } */
export type ExchangeRates = Record<string, { unit: number; value: number }>;

export const CURRENCY_OPTIONS = ["KRW", "JPY", "USD", "EUR", "TWD", "THB", "VND", "CNY"] as const;
