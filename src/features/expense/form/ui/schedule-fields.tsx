import { useState } from "react";

import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";

import type { ExpenseFormState } from "../model/use-expense-form";
import { CategoryField, DayField, NameField, SpentTimeField } from "./expense-fields";
import { LinkField } from "./link-field";
import { LinkedBundle } from "./linked-bundle";

type ScheduleFieldsProps = {
  form: ExpenseFormState;
  trip: Trip;
  items: ScheduleItem[];
  alternatives: ScheduleItem[];
  /** 빠른 입력 중 — 맨 위 요약이 대신 보이므로 칸을 숨긴다 */
  quick: boolean;
};

/**
 * 일정 연결 → 카테고리 → 날짜 → 시간(선택) → 항목명. 일정을 연결하면 세 칸 대신 「일정에서 가져옴」 묶음(LinkedBundle) + 시간.
 * 빠른 입력이면 연결 · 카테고리 · 날짜를 숨기고 항목명만 — 단 연 때 카테고리가 비어 있었으면(카테고리 없는 장소처럼 일정 종류로 못 정함)
 * 카테고리 칸은 둔다. 없으면 저장할 수 없다
 */
export function ScheduleFields({ form, trip, items, alternatives, quick }: ScheduleFieldsProps) {
  const [categoryKnown] = useState(form.category !== null);
  // 직접 고른 날짜의 day 순번(0 부터) — 고르기 창이 그날로 걸러 연다. 고르지 않았거나 여행준비면 null(전체 날짜에서 「연결 안 함」 부터)
  const dayIndex = form.link.dayTouched
    ? form.link.days.findIndex((o) => o.value === form.spentOn) - 1
    : -1;
  if (quick)
    return (
      <>
        {!categoryKnown && <CategoryField form={form} />}
        <NameField form={form} />
        <SpentTimeField form={form} />
      </>
    );
  const linked = form.link.linked;
  return (
    <>
      <LinkField
        link={form.link}
        startDate={trip.start_date}
        items={items}
        alternatives={alternatives}
        dayIndex={dayIndex >= 0 ? dayIndex : null}
      />
      {linked ? (
        <>
          <LinkedBundle form={form} trip={trip} linked={linked} />
          <SpentTimeField form={form} />
        </>
      ) : (
        <>
          <CategoryField form={form} />
          <DayField form={form} trip={trip} />
          <SpentTimeField form={form} />
          <NameField form={form} />
        </>
      )}
    </>
  );
}

type TopFieldsProps = {
  form: ExpenseFormState;
  trip: Trip;
  items: ScheduleItem[];
  alternatives: ScheduleItem[];
  /** 숙소 · 항공편 결제 */
  payment: boolean;
  quick: boolean;
};

/** 금액 아래 첫 칸들 — 숙소 · 항공편 결제면 날짜만(이름 · 카테고리 · 연결은 그쪽이 정한다), 아니면 일정 연결 → 카테고리 → 날짜 → 항목명 */
export function TopFields({ form, trip, items, alternatives, payment, quick }: TopFieldsProps) {
  if (payment)
    return (
      <>
        <DayField form={form} trip={trip} />
        <SpentTimeField form={form} />
      </>
    );
  return (
    <ScheduleFields
      form={form}
      trip={trip}
      items={items}
      alternatives={alternatives}
      quick={quick}
    />
  );
}
