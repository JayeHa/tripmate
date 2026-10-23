import type { ExpenseCreateVars } from "../model/expense-sync";
import type { ExpenseWithSplits } from "../model/types";
import { insertColumns } from "./columns";
import { personKey } from "./person";
import type { PersonShare } from "./shares";

/**
 * 화면에 먼저 보일 새 지출 — 서버가 채울 칸(때 · 숙소 · 항공편)은 누른 쪽 값으로.
 * 나눔 줄의 id 는 서버가 만들기 전이라 지출 id + 사람 키로 임시로 둔다(화면은 id 를 key 로만 쓴다)
 */
export function optimisticExpense(v: ExpenseCreateVars, shares: PersonShare[]): ExpenseWithSplits {
  return {
    ...insertColumns(v.values),
    id: v.id,
    trip_id: v.tripId,
    stay_id: null,
    flight_id: null,
    created_by: v.createdBy,
    created_at: v.createdAt,
    updated_at: v.createdAt,
    splits: shares.map((s) => ({
      id: `${v.id}:${personKey(s.person)}`,
      expense_id: v.id,
      trip_id: v.tripId,
      user_id: s.person.kind === "member" ? s.person.id : null,
      guest_id: s.person.kind === "guest" ? s.person.id : null,
      share: s.share,
    })),
  };
}
