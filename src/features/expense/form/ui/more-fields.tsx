import { todayISO } from "@/shared/lib/days";
import { DateField } from "@/shared/ui/date-field";
import { FilterChip } from "@/shared/ui/filter-chip";
import { MoreSection } from "@/shared/ui/more-section";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";

import type { ExpenseFormState } from "../model/use-expense-form";

type MoreFieldsProps = { form: ExpenseFormState };

/**
 * 「추가 정보 입력」 — 자주 안 쓰는 칸을 접어 둔다: 결제 상태(+ 예정일) · 메모 · 합계에서 제외.
 * 예정일 달력은 맨 아래 칸이라 위로 연다. 지난 날은 고르지 않는다
 */
export function MoreFields({ form }: MoreFieldsProps) {
  return (
    <MoreSection
      title="추가 정보 입력"
      hint="결제 상태 · 메모 · 합계 제외"
      open={form.moreOpen}
      onOpenChange={form.setMoreOpen}
    >
      <div role="group" aria-labelledby="expense-paid" className="flex flex-col gap-2">
        <span id="expense-paid" className="text-sm text-ink-400">
          결제 상태
        </span>
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
      <div className="flex flex-col gap-2">
        <label htmlFor="expense-memo" className="text-sm text-ink-400">
          메모 (선택)
        </label>
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
      <div className="flex items-center gap-3 pb-3">
        <label htmlFor="expense-excluded" className="flex flex-1 flex-col gap-0.75">
          <span className="text-base font-bold text-ink-900">합계에서 제외</span>
          <span className="text-[13px] text-ink-400">
            총합계·날짜별 합계·정산에서 빠져요. 대체 장소로 바뀐 일정의 비용은 자동으로 제외돼요.
          </span>
        </label>
        <Switch
          id="expense-excluded"
          checked={!form.counted}
          onCheckedChange={(excluded) => form.setCounted(!excluded)}
        />
      </div>
    </MoreSection>
  );
}
