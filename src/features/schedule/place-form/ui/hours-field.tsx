import { WEEK_DAY_LABEL, WEEK_DAYS, type WeekDay } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import { mondayToAll, type PlaceFormValues } from "../lib/place-form";
import type { PlaceFormState } from "../model/use-place-form";
import { Field, inputClass } from "./form-parts";

const MODES = [
  ["same", "매일 같음"],
  ["week", "요일별"],
] as const satisfies readonly (readonly [PlaceFormValues["hoursMode"], string])[];

/** 요일 라벨 색 — 토 파랑 · 일 빨강 */
const DAY_TONE: Partial<Record<WeekDay, string>> = {
  sat: "text-primary",
  sun: "text-destructive",
};

type HoursFieldProps = { form: PlaceFormState };

/**
 * 운영시간 — 「매일 같음 | 요일별」. 매일 같음은 한 줄, 요일별은 월~일 7줄(줄마다 「휴무」 토글)과
 * 「월요일 시간을 모든 요일에 적용」. 일정 카드는 그 일정 요일의 값만 대표로 보인다(hoursOnDay).
 */
export function HoursField({ form }: HoursFieldProps) {
  const { values: v, set } = form;
  return (
    <Field label="운영시간" optional aside={<ModeSwitch form={form} />}>
      {v.hoursMode === "same" ? (
        <input
          value={v.hours}
          onChange={(e) => set("hours", e.target.value)}
          placeholder="예) 11:00–21:00"
          aria-label="운영시간"
          className={inputClass}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {WEEK_DAYS.map((day) => (
            <DayRow key={day} form={form} day={day} />
          ))}
          <button
            type="button"
            onClick={() => set("hoursWeek", mondayToAll(v.hoursWeek))}
            className="self-start text-[13px] font-bold text-primary"
          >
            월요일 시간을 모든 요일에 적용
          </button>
        </div>
      )}
    </Field>
  );
}

/** 「매일 같음 | 요일별」 세그먼트 */
function ModeSwitch({ form }: HoursFieldProps) {
  return (
    <span className="flex rounded-full bg-surface-muted p-0.5">
      {MODES.map(([mode, label]) => {
        const on = form.values.hoursMode === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={on}
            onClick={() => form.set("hoursMode", mode)}
            className={cn(
              "h-7 rounded-full px-3 text-xs font-bold",
              on ? "bg-white text-ink-900 shadow-[0_1px_3px_rgba(0,0,0,.1)]" : "text-ink-400",
            )}
          >
            {label}
          </button>
        );
      })}
    </span>
  );
}

type DayRowProps = HoursFieldProps & { day: WeekDay };

/** 요일 한 줄: 요일 · 시간 칸 · 「휴무」 토글(휴무면 시간 칸을 잠근다) */
function DayRow({ form, day }: DayRowProps) {
  const week = form.values.hoursWeek;
  const value = week[day];
  const off = value === null;
  const setDay = (next: string | null) => form.set("hoursWeek", { ...week, [day]: next });
  return (
    <div className="grid grid-cols-[24px_minmax(0,1fr)_56px] items-center gap-2">
      <span className={cn("text-center text-sm font-bold text-ink-700", DAY_TONE[day])}>
        {WEEK_DAY_LABEL[day]}
      </span>
      <input
        value={value ?? ""}
        onChange={(e) => setDay(e.target.value)}
        disabled={off}
        placeholder={off ? "휴무" : "10:00–20:00"}
        aria-label={`${WEEK_DAY_LABEL[day]}요일 운영시간`}
        className={cn(inputClass, "h-10", off && "bg-surface-sunken")}
      />
      <button
        type="button"
        aria-pressed={off}
        onClick={() => setDay(off ? "" : null)}
        className={cn(
          "h-10 rounded-button border text-[13px] font-bold",
          off
            ? "border-destructive-soft bg-destructive-soft text-destructive"
            : "border-line bg-white text-ink-400",
        )}
      >
        휴무
      </button>
    </div>
  );
}
