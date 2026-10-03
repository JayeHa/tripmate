import { z } from "zod";

import { EXPENSE_CATEGORIES } from "./types";

export const expenseFormSchema = z.object({
  amount: z.number().positive("금액을 입력하세요"),
  currency: z.string().min(1),
  payer_id: z.string().min(1, "결제한 사람을 선택하세요"),
  participant_ids: z.array(z.string()).min(1, "나눌 사람을 1명 이상 선택하세요"),
  split_mode: z.enum(["equal", "custom"]),
  /** custom 일 때만 사용. user_id → share */
  custom_shares: z.record(z.string(), z.number().nonnegative()).optional(),
  category: z.enum(EXPENSE_CATEGORIES),
  memo: z.string().trim().max(200).optional(),
  spent_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜를 선택하세요"),
  schedule_item_id: z.string().nullable().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
