import { Pin } from "lucide-react";
import { Fragment } from "react";

import { todayISO } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import { DateField } from "@/shared/ui/date-field";
import { FilterChip } from "@/shared/ui/filter-chip";
import { MoreSection } from "@/shared/ui/more-section";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";

import { PIN_FIELDS, type PinField, pinHint, pinToast } from "../lib/pins";
import type { ExpenseFormState } from "../model/use-expense-form";
import type { FormPrefs } from "../model/use-form-prefs";
import type { ReceiptDrafts } from "../model/use-receipt-drafts";
import { ReceiptsField } from "./receipts-field";

type MoreFieldsProps = {
  form: ExpenseFormState;
  prefs: FormPrefs;
  tripId: string;
  /** 「영수증」 칸의 고른 파일들 */
  drafts: ReceiptDrafts;
  /** 고정 · 풀기 토스트 — 화면이 하나를 그린다 */
  onToast?: (text: string) => void;
};

/**
 * 「추가 정보 입력」 — 자주 안 쓰는 칸을 접어 둔다: 결제 상태(+ 예정일) · 메모 · 영수증 · 합계에서 제외.
 * 칸마다 이름 오른쪽 「📌 고정」 을 켜면 그 칸이 아코디언 위(밖)로 올라가 늘 보이고 접힌 안내에서 빠진다(기기별 기억).
 * 넷 다 고정하면 아코디언이 없다. 예정일 달력은 맨 아래 칸이라 위로 연다. 지난 날은 고르지 않는다
 */
export function MoreFields({ form, prefs, tripId, drafts, onToast }: MoreFieldsProps) {
  const pinned = PIN_FIELDS.filter((f) => prefs.pins.includes(f));
  const rest = PIN_FIELDS.filter((f) => !pinned.includes(f));
  /** 그 칸의 고정 버튼 */
  const pin = (field: PinField) => (
    <PinButton
      on={pinned.includes(field)}
      onClick={() => onToast?.(pinToast(field, prefs.togglePin(field)))}
    />
  );
  /** 칸 하나 */
  const block = (field: PinField) => {
    if (field === "paid") return <PaidField form={form} pin={pin("paid")} />;
    if (field === "memo") return <MemoField form={form} pin={pin("memo")} />;
    if (field === "receipts")
      return <ReceiptsField tripId={tripId} drafts={drafts} titleRight={pin("receipts")} />;
    return <ExcludedField form={form} pin={pin("excluded")} />;
  };
  return (
    <>
      {pinned.map((f) => (
        <Fragment key={f}>{block(f)}</Fragment>
      ))}
      {rest.length > 0 && (
        <MoreSection
          title="추가 정보 입력"
          hint={pinHint(pinned)}
          open={form.moreOpen}
          onOpenChange={form.setMoreOpen}
        >
          {rest.map((f) => (
            <Fragment key={f}>{block(f)}</Fragment>
          ))}
        </MoreSection>
      )}
    </>
  );
}

type PinButtonProps = { on: boolean; onClick: () => void };

/** 「📌 고정」 pill 26 · 11/700 — 꺼짐 회색 「고정」, 켜짐 연한 블루 「고정됨」 */
function PinButton({ on, onClick }: PinButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex h-6.5 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-bold",
        on ? "bg-brand-soft text-brand-text" : "bg-surface-muted text-ink-450",
      )}
    >
      <Pin className="size-3" aria-hidden="true" />
      {on ? "고정됨" : "고정"}
    </button>
  );
}

type FieldProps = { form: ExpenseFormState; pin: React.ReactNode };

/** 결제 상태 — 결제 완료 · 결제 예정 칩, 예정이면 예정일 */
function PaidField({ form, pin }: FieldProps) {
  return (
    <div role="group" aria-labelledby="expense-paid" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span id="expense-paid" className="text-sm text-ink-400">
          결제 상태
        </span>
        {pin}
      </div>
      <div className="flex gap-1.5">
        <FilterChip size="lg" selected={form.paid} onClick={() => form.setPaid(true)}>
          결제 완료
        </FilterChip>
        <FilterChip size="lg" selected={!form.paid} onClick={() => form.setPaid(false)}>
          결제 예정
        </FilterChip>
      </div>
      {!form.paid && (
        <div className="max-w-60">
          <DateField
            value={form.dueDate}
            onChange={form.setDueDate}
            min={todayISO()}
            placement="top"
            placeholder="결제 예정일 선택"
            aria-label="결제 예정일"
          />
        </div>
      )}
    </div>
  );
}

/** 메모(선택) — 3줄, 200자 */
function MemoField({ form, pin }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="expense-memo" className="text-sm text-ink-400">
          메모 (선택)
        </label>
        {pin}
      </div>
      <Textarea
        id="expense-memo"
        rows={3}
        maxLength={200}
        value={form.memo}
        onChange={(e) => form.setMemo(e.target.value)}
        placeholder="메모를 입력해 주세요"
        className="min-h-21 resize-none leading-normal"
      />
    </div>
  );
}

/** 합계에서 제외 — 스위치. 고정 버튼은 이름 옆(스위치는 오른쪽 끝) */
function ExcludedField({ form, pin }: FieldProps) {
  return (
    <div className="flex items-center gap-3 pb-3">
      <div className="flex flex-1 flex-col gap-0.75">
        <div className="flex items-center gap-2">
          <label htmlFor="expense-excluded" className="text-base font-bold text-ink-900">
            합계에서 제외
          </label>
          {pin}
        </div>
        <span className="text-[13px] text-ink-400">
          총합계·날짜별 합계·정산에서 빠져요. 대체 장소로 바뀐 일정의 비용은 자동으로 제외돼요.
        </span>
      </div>
      <Switch
        id="expense-excluded"
        checked={!form.counted}
        onCheckedChange={(excluded) => form.setCounted(!excluded)}
      />
    </div>
  );
}
