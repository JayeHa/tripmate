import { z } from "zod";

import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "./types";

/** 가계부에 나오는 사람 — 멤버이거나 초대 없이 넣은 정산 인원 */
const personSchema = z.object({
  kind: z.enum(["member", "guest"]),
  id: z.string().min(1),
});

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

export const expenseFormSchema = z
  .object({
    /** 항목명 */
    name: z.string().trim().min(1, "항목명을 입력하세요").max(100),
    amount: z.number().positive("금액을 입력하세요"),
    currency: z.string().min(1),
    /** 이 지출에만 쓰는 환율(기준 화폐 / 통화 1단위). null 이면 여행 기본 환율 */
    rate: z.number().positive().nullable(),
    payment_method: z.enum(PAYMENT_METHODS),
    /** 결제한 사람. 「각자 냄」 이면 null */
    payer: personSchema.nullable(),
    /** 각자 자기 몫을 냈다 — 결제자가 없고 정산에서 빠진다 */
    split_each: z.boolean(),
    participants: z.array(personSchema).min(1, "나눌 사람을 1명 이상 선택하세요"),
    split_mode: z.enum(["equal", "custom"]),
    /** custom 일 때만 사용. user_id → share */
    custom_shares: z.record(z.string(), z.number().nonnegative()).optional(),
    category: z.enum(EXPENSE_CATEGORIES),
    memo: z.string().trim().max(200).optional(),
    /** 쓴 날. null 이면 여행준비 */
    spent_on: z.string().regex(DATE, "날짜를 선택하세요").nullable(),
    /** 쓴 시각 「HH:MM」(선택). 여행준비면 저장하지 않는다. 기기에 남은 예전 대기열 값에는 없다 */
    spent_time: z.string().regex(TIME).nullable().optional(),
    schedule_item_id: z.string().nullable().optional(),
    /** 쓴 곳(장소 id, 선택). 일정을 연결하면 저장하지 않는다 — 그 일정의 장소를 쓴다 */
    place_id: z.string().nullable().optional(),
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
  })
  .refine((v) => v.split_each === (v.payer === null), {
    message: "각자 냄이 아니면 결제한 사람을 선택하세요",
    path: ["payer"],
  });

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

/**
 * 아직 저장하지 않은 비용 — 비용 입력의 값과, 이미 저장소에 올렸지만 어디에도 붙지 않은 영수증.
 * 새 숙소 폼처럼 붙일 곳이 아직 없을 때 들고 있다가, 그곳을 저장한 뒤 비용을 만든다
 */
export type ExpenseDraft = {
  values: ExpenseFormValues;
  receipts: { key: string; name: string; mime: string; size: number }[];
};
