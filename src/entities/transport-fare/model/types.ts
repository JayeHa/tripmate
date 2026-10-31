import type { Tables } from "@/shared/api/supabase/database.types";

/**
 * 1인 예상 교통비 한 줄(0072). 날짜 줄은 day_index 가 있고 이름이 없다,
 * 날짜 밖 줄(공항 왕복 · 패스)은 day_index 가 null 이고 이름이 있다
 */
export type TransportFare = Tables<"transport_fares">;

/** 줄에 적는 값 — 금액은 비울 수 있다(메모만) */
export type FareDraft = { amount: number | null; currency: string; memo: string | null };
