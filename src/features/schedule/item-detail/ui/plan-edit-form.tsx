import { useState } from "react";

import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUSES,
  type ReservationStatus,
  type ScheduleItem,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { LinkRows } from "@/shared/ui/link-rows";
import { TimeField } from "@/shared/ui/time-field";

import type { PlanEditState } from "../model/use-plan-edit";

type PlanEditFormProps = { item: ScheduleItem; edit: PlanEditState };

/**
 * 대체 장소의 시간 칸 안내. 시간은 자리(타임라인 줄)의 것이라 대체 장소는 갖지 않고(DB check), 바꾸면 그 자리의 시간이 된다
 */
export const ALTERNATIVE_TIME_NOTE = "대체 장소라 시간을 바꿀 수 없어요.";

/** 수정 칸 입력 상자 — 높이 44 · 둥글기 10 */
const inputClass =
  "h-11 rounded-memo border border-line text-sm text-ink-900 outline-none focus:border-primary";

/**
 * 「이번 일정 수정」 창의 칸: 아이콘(일정마다 따로) · (place) 예약 상태 4칸 · 시간 · 일정 링크 / (그 밖) 제목 · 시간, 아래 취소 · 저장.
 * 아이콘을 비우면 장소의 예전 아이콘이 있으면 그것이 보여 자리 표시로 알려 준다
 */
export function PlanEditForm({ item, edit }: PlanEditFormProps) {
  // 마지막으로 그린 칸 값. 닫힐 때(취소 · 저장) draft 가 먼저 비어도 창이 사라지는 동안은 이 값으로 그린다 —
  // 그러지 않으면 본문이 먼저 빠져 머리만 남은 시트가 줄어들며 사라진다
  const [shown, setShown] = useState(edit.draft);
  if (edit.draft && edit.draft !== shown) setShown(edit.draft);
  const draft = edit.draft ?? shown;
  if (!draft) return null;
  const isPlace = item.kind === "place";
  const options: (ReservationStatus | null)[] = [null, ...RESERVATION_STATUSES];
  return (
    <div className="flex flex-col gap-3">
      <EditField label={isPlace ? "아이콘" : "아이콘 · 제목"}>
        <div
          className={cn(
            "grid gap-2",
            isPlace ? "grid-cols-[52px]" : "grid-cols-[52px_minmax(0,1fr)]",
          )}
        >
          <input
            value={draft.emoji}
            onChange={(e) => edit.set("emoji", e.target.value.trim())}
            maxLength={8}
            placeholder={item.place?.emoji || "🙂"}
            aria-label="아이콘"
            className={`${inputClass} px-0 text-center text-xl`}
          />
          {!isPlace && (
            <input
              value={draft.name}
              onChange={(e) => edit.set("name", e.target.value)}
              maxLength={100}
              aria-label="제목"
              className={`${inputClass} px-3`}
            />
          )}
        </div>
      </EditField>
      {isPlace && (
        <EditField label="예약 상태">
          <div className="grid grid-cols-4 gap-1.5">
            {options.map((s) => (
              <button
                key={s ?? "none"}
                type="button"
                aria-pressed={draft.status === s}
                onClick={() => edit.set("status", s)}
                className={cn(
                  "h-9.5 rounded-button border text-xs font-bold",
                  draft.status === s ? statusOn(s) : "border-line bg-white text-ink-500",
                )}
              >
                {s ? RESERVATION_STATUS_LABEL[s] : "없음"}
              </button>
            ))}
          </div>
        </EditField>
      )}
      <EditField label="방문 예상 시간">
        {item.alternative_of ? (
          <span className="text-sm text-ink-350">{ALTERNATIVE_TIME_NOTE}</span>
        ) : (
          <TimeField
            value={draft.time}
            onChange={(time) => edit.set("time", time)}
            aria-label="방문 예상 시간"
          />
        )}
      </EditField>
      {isPlace && (
        <EditField label="일정 링크">
          <LinkRows
            label="일정 링크"
            titlePlaceholder="링크 제목 (예: KKday 예약)"
            links={draft.links}
            onChange={(links) => edit.set("links", links)}
          />
        </EditField>
      )}
      {edit.error && <p className="text-[13px] text-destructive">{edit.error}</p>}
      <div className="flex gap-2">
        {/* 저장 중에는 창의 ✕ · 바깥 누르기처럼 「취소」 도 막는다 — 닫히면 실패 문구가 함께 사라져 저장된 줄 안다 */}
        <Button
          variant="chip"
          size="form"
          className="flex-1"
          disabled={edit.locked}
          onClick={edit.cancel}
        >
          취소
        </Button>
        <Button size="form" className="flex-2" disabled={edit.saving} onClick={edit.save}>
          저장
        </Button>
      </div>
    </div>
  );
}

/** 고른 상태 칸의 색 — 그 상태 색, 「없음」 은 잉크 */
const STATUS_ON = {
  ok: "border-transparent bg-status-ok-bg text-status-ok",
  wait: "border-transparent bg-status-wait-bg text-status-wait",
  opt: "border-transparent bg-status-opt-bg text-status-opt",
} satisfies Record<ReservationStatus, string>;
/** 고른 칸의 색. 「없음」(null) 은 잉크 */
const statusOn = (s: ReservationStatus | null) =>
  s ? STATUS_ON[s] : "border-transparent bg-ink-900 text-white";

type EditFieldProps = { label: string; children: React.ReactNode };

/** 수정 칸 하나: 13/700 라벨 + 내용 */
function EditField({ label, children }: EditFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold text-ink-700">{label}</span>
      {children}
    </div>
  );
}
