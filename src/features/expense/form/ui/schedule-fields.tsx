import { useState } from "react";

import type { ExpenseWithSplits } from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";

import { linkCosts } from "../lib/link-costs";
import type { ExpenseFormState } from "../model/use-expense-form";
import { CategoryField, DayField } from "./expense-fields";
import { LinkField } from "./link-field";

type ScheduleFieldsProps = {
  form: ExpenseFormState;
  trip: Trip;
  items: ScheduleItem[];
  alternatives: ScheduleItem[];
  expenses: ExpenseWithSplits[];
  expenseId?: string;
  /** 빠른 입력 중 — 맨 위 요약이 대신 보이므로 칸을 숨긴다 */
  quick: boolean;
};

/**
 * 일정 연결 → 카테고리 → 날짜. 빠른 입력이면 모두 숨긴다 —
 * 단 연 때 카테고리가 비어 있었으면(휴식처럼 일정 종류로 못 정함) 카테고리 칸은 둔다. 없으면 저장할 수 없다
 */
export function ScheduleFields({
  form,
  trip,
  items,
  alternatives,
  expenses,
  expenseId,
  quick,
}: ScheduleFieldsProps) {
  const [categoryKnown] = useState(form.category !== null);
  const costs = linkCosts(expenses, trip.home_currency, trip.exchange_rates, expenseId);
  // 지금 날짜의 day 순번(0 부터). 여행준비(빈 글)면 null — 날짜 옵션의 첫 줄이 여행준비라 하나 뺀다
  const dayIndex = form.link.days.findIndex((o) => o.value === form.spentOn) - 1;
  if (quick) return categoryKnown ? null : <CategoryField form={form} />;
  return (
    <>
      <LinkField
        link={form.link}
        items={items}
        alternatives={alternatives}
        costs={costs}
        home={trip.home_currency}
        dayIndex={dayIndex >= 0 ? dayIndex : null}
      />
      <CategoryField form={form} />
      <DayField form={form} trip={trip} />
    </>
  );
}
