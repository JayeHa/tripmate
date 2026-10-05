import { z } from "zod";

import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "./types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const expenseFormSchema = z
  .object({
    /** 항목명 */
    name: z.string().trim().min(1, "항목명을 입력하세요").max(100),
    amount: z.number().positive("금액을 입력하세요"),
    currency: z.string().min(1),
    /** 이 지출에만 쓰는 환율(기준 화폐 / 통화 1단위). null 이면 여행 기본 환율 */
    rate: z.number().positive().nullable(),
    payment_method: z.enum(PAYMENT_METHODS),
    payer_id: z.string().min(1, "결제한 사람을 선택하세요"),
    participant_ids: z.array(z.string()).min(1, "나눌 사람을 1명 이상 선택하세요"),
    split_mode: z.enum(["equal", "custom"]),
    /** custom 일 때만 사용. user_id → share */
    custom_shares: z.record(z.string(), z.number().nonnegative()).optional(),
    category: z.enum(EXPENSE_CATEGORIES),
    memo: z.string().trim().max(200).optional(),
    /** 쓴 날. null 이면 여행준비 */
    spent_on: z.string().regex(DATE, "날짜를 선택하세요").nullable(),
    schedule_item_id: z.string().nullable().optional(),
    /** 합계 · 통계 · 정산에 넣을지 */
    counted: z.boolean(),
    /** 결제 완료(true) / 결제 예정(false) */
    paid: z.boolean(),
    /** 결제 예정일 — 결제 예정일 때만 */
    due_date: z.string().regex(DATE).nullable(),
  })
  .refine((v) => !v.paid || v.due_date === null, {
    message: "결제 예정일은 결제 예정일 때만 적어요",
    path: ["due_date"],
  });

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
