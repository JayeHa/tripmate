import { type Share, splitEqual, validateCustomShares } from "@/shared/lib/money";

import type { ExpenseFormValues } from "../model/schema";
import { personKey, personOfKey, type PersonRef } from "./person";

/** 한 사람의 몫 */
export type PersonShare = { person: PersonRef; share: number };

/**
 * 폼 값 → 나눠 낸 몫. 사람은 멤버이거나 정산 인원이라 키(`m:…` · `g:…`)로 나눈 뒤 다시 사람으로 되돌린다.
 * custom 이면 검증 후 사용
 */
export function resolveShares(values: ExpenseFormValues): PersonShare[] {
  const keys = values.participants.map(personKey);
  const shares = sharesOf(values, keys);
  return shares.flatMap((s) => {
    const person = personOfKey(s.userId);
    return person ? [{ person, share: s.share }] : [];
  });
}

/** 키마다의 몫 — 직접 나누기면 적은 값을 검증하고, 아니면 똑같이 나눈다 */
function sharesOf(values: ExpenseFormValues, keys: string[]): Share[] {
  if (values.split_mode !== "custom") return splitEqual(values.amount, values.currency, keys);
  const shares = keys.map((key) => ({ userId: key, share: values.custom_shares?.[key] ?? 0 }));
  const result = validateCustomShares(values.amount, values.currency, shares);
  if (!result.ok) throw new Error(result.error);
  return result.shares;
}

/** 나눠 낸 몫 한 줄 — 멤버면 user_id, 정산 인원이면 guest_id */
export function splitRow(expenseId: string, s: PersonShare) {
  return {
    expense_id: expenseId,
    user_id: s.person.kind === "member" ? s.person.id : null,
    guest_id: s.person.kind === "guest" ? s.person.id : null,
    share: s.share,
  };
}
