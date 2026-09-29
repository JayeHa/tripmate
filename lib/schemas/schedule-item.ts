import { z } from "zod";

export const scheduleItemFormSchema = z.object({
  name: z.string().trim().min(1, "장소 이름을 입력하세요").max(100),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "HH:mm 형식")
    .or(z.literal(""))
    .optional(),
  memo: z.string().trim().max(500).optional(),
});

export type ScheduleItemFormValues = z.infer<typeof scheduleItemFormSchema>;
