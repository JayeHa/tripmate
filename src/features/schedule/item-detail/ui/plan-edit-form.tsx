import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUSES,
  type ReservationStatus,
  type ScheduleItem,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { LinkRows } from "@/shared/ui/link-rows";

import type { PlanEditState } from "../model/use-plan-edit";

type PlanEditFormProps = { item: ScheduleItem; edit: PlanEditState };

/** 그 자리 수정 칸: (place) 예약 상태 4칸 · 시간 · 일정 링크 / (그 밖) 제목 · 시간, 아래 취소 · 저장 */
export function PlanEditForm({ item, edit }: PlanEditFormProps) {
  const draft = edit.draft;
  if (!draft) return null;
  const isPlace = item.kind === "place";
  const options: (ReservationStatus | null)[] = [null, ...RESERVATION_STATUSES];
  return (
    <div className="flex flex-col gap-3 rounded-card border border-primary p-3.5">
      {!isPlace && (
        <EditField label="제목">
          <input
            value={draft.name}
            onChange={(e) => edit.set("name", e.target.value)}
            maxLength={100}
            aria-label="제목"
            className="h-11 rounded-memo border border-line px-3 text-sm text-ink-900 outline-none focus:border-primary"
          />
        </EditField>
      )}
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
        <input
          type="time"
          value={draft.time}
          onChange={(e) => edit.set("time", e.target.value)}
          aria-label="방문 예상 시간"
          className="h-11 rounded-memo border border-line px-3 text-sm text-ink-900 outline-none focus:border-primary"
        />
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
        <Button variant="secondary" className="h-11 flex-1" onClick={edit.cancel}>
          취소
        </Button>
        <Button className="h-11 flex-2" disabled={edit.saving} onClick={edit.save}>
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
