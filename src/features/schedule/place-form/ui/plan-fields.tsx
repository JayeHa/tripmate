import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUSES,
  type ReservationStatus,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import type { PlaceFormState } from "../model/use-place-form";
import { Field, inputClass, LinkListField } from "./form-parts";

/** 상태 버튼 바탕 · 글자색. 「없음」 은 잉크 */
const STATUS_TONE = {
  ok: "bg-status-ok-bg text-status-ok",
  wait: "bg-status-wait-bg text-status-wait",
  opt: "bg-status-opt-bg text-status-opt",
} satisfies Record<ReservationStatus, string>;

type PlanFieldsProps = {
  form: PlaceFormState;
  /** 「day 2에만 해당돼요」 */
  dayLabel: string;
};

/** 이번 일정 — 이번 방문에만 맞는 정보(일정 테이블). 예약 상태 · 방문 시간 · 일정 링크 · 메모 */
export function PlanFields({ form, dayLabel }: PlanFieldsProps) {
  const { values: v, set } = form;
  const options: (ReservationStatus | null)[] = [null, ...RESERVATION_STATUSES];
  return (
    <>
      <div className="flex flex-col gap-1 border-t border-divider pt-5">
        <span className="text-[17px] font-extrabold text-ink-900">이번 일정</span>
        <span className="text-[13px]/normal text-ink-400">
          {dayLabel}에만 해당돼요. 같은 장소를 다른 날 넣어도 따로 관리돼요.
        </span>
      </div>
      <Field label="예약 상태">
        <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="예약 상태">
          {options.map((s) => {
            const on = v.status === s;
            return (
              <button
                key={s ?? "none"}
                type="button"
                aria-pressed={on}
                onClick={() => set("status", s)}
                className={cn(
                  "h-10 rounded-button border text-[13px] font-bold",
                  !on && "border-line bg-white text-ink-500",
                  on && "border-transparent",
                  on && (s ? STATUS_TONE[s] : "bg-ink-900 text-white"),
                )}
              >
                {s ? RESERVATION_STATUS_LABEL[s] : "없음"}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="방문 시간" optional>
        <input
          type="time"
          value={v.time}
          onChange={(e) => set("time", e.target.value)}
          aria-label="방문 시간"
          className={inputClass}
        />
      </Field>
      <LinkListField
        label="일정 링크"
        titlePlaceholder="예약 페이지 · 구매한 상품"
        links={v.planLinks}
        onChange={(links) => set("planLinks", links)}
      />
      <Field label="메모" optional>
        <textarea
          value={v.memo}
          onChange={(e) => set("memo", e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="한 줄에 하나씩 적으면 카드에 목록으로 보여요"
          className="w-full resize-none rounded-card border border-line px-3.5 py-3 text-[15px]/relaxed text-ink-900 outline-none focus:border-primary"
        />
      </Field>
    </>
  );
}
