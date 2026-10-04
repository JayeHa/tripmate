"use client";

import type { ExpenseFormValues } from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import type { TripMember } from "@/entities/trip-member";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { useExpenseForm } from "../model/use-expense-form";
import { AmountField, CategoryField, DateItemFields, PeopleFields } from "./expense-fields";
import { SplitField } from "./split-field";

type Props = {
  trip: Trip;
  members: TripMember[];
  items?: ScheduleItem[];
  currentUserId: string;
  initial?: ExpenseFormValues;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (values: ExpenseFormValues) => void;
};

/** 지출 추가 · 수정 폼. 상태와 검증은 useExpenseForm, 칸들은 expense-fields · split-field 가 그린다 */
export function ExpenseForm({
  trip,
  members,
  items = [],
  currentUserId,
  initial,
  submitLabel,
  pending,
  onSubmit,
}: Props) {
  const form = useExpenseForm({ trip, members, currentUserId, initial, onSubmit });
  return (
    <form onSubmit={form.submit} className="flex flex-col gap-5">
      <AmountField form={form} autoFocus={!initial} />
      <CategoryField form={form} />
      <PeopleFields form={form} members={members} />
      <SplitField form={form} members={members} />
      <DateItemFields form={form} trip={trip} items={items} />
      <div className="flex flex-col gap-1.5">
        <Label>메모 (선택)</Label>
        <Input
          value={form.memo}
          onChange={(e) => form.setMemo(e.target.value)}
          placeholder="예: 이치란 라멘 3인"
        />
      </div>
      {form.error && <p className="text-sm text-destructive">{form.error}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "저장 중..." : submitLabel}
      </Button>
    </form>
  );
}
