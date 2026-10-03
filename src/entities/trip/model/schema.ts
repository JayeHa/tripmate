import { z } from "zod";

export const exchangeRateSchema = z.object({
  currency: z.string().min(1, "화폐를 선택하세요"),
  unit: z.number().positive("단위는 0보다 커야 합니다"),
  value: z.number().positive("환율은 0보다 커야 합니다"),
});

export const tripFormSchema = z
  .object({
    title: z.string().trim().min(1, "여행 이름을 입력하세요").max(50),
    destination: z.string().trim().max(50).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "시작일을 선택하세요"),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "종료일을 선택하세요"),
    home_currency: z.string().min(1),
    rates: z.array(exchangeRateSchema),
  })
  .refine((v) => v.end_date >= v.start_date, {
    message: "종료일은 시작일 이후여야 합니다",
    path: ["end_date"],
  })
  .refine((v) => new Set(v.rates.map((r) => r.currency)).size === v.rates.length, {
    message: "같은 화폐가 중복되었습니다",
    path: ["rates"],
  });

export type TripFormValues = z.infer<typeof tripFormSchema>;
