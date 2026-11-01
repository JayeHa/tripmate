import { createClient } from "@/shared/api/supabase/client";

import type { RefundSteps, TaxRefund, TaxRefundFields } from "../model/types";

/** 고치려는 건이 없다 — 그사이 일행이 지웠다 */
export const REFUND_GONE = "이미 지워진 환급 기록이에요";

/** 여행의 택스 리펀 — 넣은 순(묶음 · 정렬은 화면이) */
export async function fetchTaxRefunds(tripId: string): Promise<TaxRefund[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tax_refunds")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at");
  if (error) throw error;
  return data;
}

/** 한 건을 넣는다 */
export async function addTaxRefund(tripId: string, fields: TaxRefundFields): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("tax_refunds").insert({ trip_id: tripId, ...fields });
  if (error) throw error;
}

/** 한 건을 고친다 — 0행이면(그사이 지웠다) REFUND_GONE */
export async function updateTaxRefund(
  id: string,
  fields: Partial<TaxRefundFields> | RefundSteps,
): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tax_refunds")
    .update(fields)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error(REFUND_GONE);
}

/** 한 건을 지운다. 이미 없으면 그대로 끝낸다 */
export async function deleteTaxRefund(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("tax_refunds").delete().eq("id", id);
  if (error) throw error;
}
