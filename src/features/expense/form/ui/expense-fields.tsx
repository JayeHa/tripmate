import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  type ExpenseFormValues,
} from "@/entities/expense";
import { itemName, type ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import type { TripMember } from "@/entities/trip-member";
import { dayCount, dayIndexToDate, dayLabel } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

import type { ExpenseFormState } from "../model/use-expense-form";

type FormProps = { form: ExpenseFormState };

/** 금액 + 통화. 통화가 하나뿐이면 고르는 칸 대신 글자로 */
export function AmountField({ form, autoFocus }: FormProps & { autoFocus: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>금액</Label>
      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="decimal"
          step={form.decimals === 0 ? 1 : 0.01}
          min={0}
          value={form.amount}
          onChange={(e) => form.setAmount(e.target.value)}
          placeholder="0"
          className="h-12 flex-1 text-2xl font-semibold"
          autoFocus={autoFocus}
        />
        {form.currencies.length > 1 ? (
          <select
            className="h-12 w-24 rounded-lg border border-input bg-transparent px-2 text-base"
            value={form.currency}
            onChange={(e) => form.setCurrency(e.target.value)}
          >
            {form.currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          <span className="flex h-12 items-center px-2 text-base text-muted-foreground">
            {form.currency}
          </span>
        )}
      </div>
    </div>
  );
}

/** 지출 카테고리 하나 */
export function CategoryField({ form }: FormProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>카테고리</Label>
      <ToggleGroup
        value={[form.category]}
        onValueChange={(v) => v[0] && form.setCategory(v[0] as ExpenseFormValues["category"])}
        className="flex-wrap justify-start"
      >
        {EXPENSE_CATEGORIES.map((c) => (
          <ToggleGroupItem key={c} value={c} size="sm">
            {EXPENSE_CATEGORY_LABEL[c]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

type PeopleFieldsProps = FormProps & { members: TripMember[] };

/** 결제한 사람(하나) · 나눌 사람(여럿, 모두 선택/해제) */
export function PeopleFields({ form, members }: PeopleFieldsProps) {
  const allIn = form.participants.length === form.memberIds.length;
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label>결제한 사람</Label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <Chip
              key={m.user_id}
              active={form.payerId === m.user_id}
              onClick={() => form.setPayerId(m.user_id)}
            >
              {m.profile.display_name ?? "이름 없음"}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label>나눌 사람</Label>
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={form.toggleAllParticipants}
          >
            {allIn ? "모두 해제" : "모두 선택"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <Chip
              key={m.user_id}
              active={form.participants.includes(m.user_id)}
              onClick={() => form.toggleParticipant(m.user_id)}
            >
              {m.profile.display_name ?? "이름 없음"}
            </Chip>
          ))}
        </div>
      </div>
    </>
  );
}

type DateItemFieldsProps = FormProps & { trip: Trip; items: ScheduleItem[] };

/** 날짜(여행준비 또는 여행 중 하루) + 그날 일정 중 연결할 것(선택) */
export function DateItemFields({ form, trip, items }: DateItemFieldsProps) {
  const days = Math.max(1, dayCount(trip.start_date, trip.end_date));
  const dayItems = items.filter(
    (it) => dayIndexToDate(trip.start_date, it.day_index) === form.spentOn,
  );
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>날짜</Label>
        <select
          className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
          value={form.spentOn}
          onChange={(e) => form.setSpentOn(e.target.value)}
        >
          <option value="">여행준비</option>
          {Array.from({ length: days }, (_, i) => (
            <option key={i} value={dayIndexToDate(trip.start_date, i)}>
              Day {i + 1} · {dayLabel(trip.start_date, i)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>연결 일정 (선택)</Label>
        <select
          className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
          value={form.itemId}
          onChange={(e) => form.setItemId(e.target.value)}
        >
          <option value="">없음</option>
          {dayItems.map((it) => (
            <option key={it.id} value={it.id}>
              {itemName(it)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

type ChipProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

/** 사람 고르는 칩. 고르면 잉크 바탕 */
function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
