"use client";

import { CircleAlert, X } from "lucide-react";
import { useRef } from "react";

import { type ExpenseFormValues, personKey, type TripGuest } from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import type { TripMember } from "@/entities/trip-member";
import { Button } from "@/shared/ui/button";

import { formPeople } from "../lib/people";
import { type ExpenseFormState, useExpenseForm } from "../model/use-expense-form";
import { AmountField } from "./amount-field";
import { CategoryField, DayField, LinkField, NameField, PaymentField } from "./expense-fields";
import { MoreFields } from "./more-fields";
import { PeopleSection } from "./people-section";

type ExpenseFormProps = {
  /** 머리 제목 — 「비용 추가」 · 「비용 수정」 */
  title: string;
  onClose: () => void;
  /** 머리 오른쪽(수정 화면의 삭제) */
  headerRight?: React.ReactNode;
  trip: Trip;
  members: TripMember[];
  guests: TripGuest[];
  items?: ScheduleItem[];
  currentUserId: string;
  initial?: ExpenseFormValues;
  /** 새 지출의 처음 날짜 — ""(여행준비) 또는 yyyy-MM-dd */
  defaultSpentOn?: string;
  pending?: boolean;
  /** 저장 요청이 실패한 이유 */
  submitError?: string | null;
  /** 저장 — 수정이면 둘째 값이 폼을 연 때의 값 */
  onSubmit: (values: ExpenseFormValues, opened: ExpenseFormValues | undefined) => void;
};

/**
 * 비용 추가 · 수정 화면. 모바일은 탭 위를 덮는 전체 화면, PC 는 가운데 440 칸.
 * 금액(맨 위) → 카테고리 → 날짜 → 일정 연결 → 항목명 → 결제수단 → 누가 내고 누구와 나눴나 → 추가 정보, 아래에 완료.
 * 새 비용은 금액을 넣기 전까지 아래 칸을 흐리게 덮고, 누르면 금액 칸으로 보낸다
 */
export function ExpenseForm({
  title,
  onClose,
  headerRight,
  trip,
  members,
  guests,
  items = [],
  currentUserId,
  initial,
  defaultSpentOn,
  pending,
  submitError,
  onSubmit,
}: ExpenseFormProps) {
  const me = personKey({ kind: "member", id: currentUserId });
  const form = useExpenseForm({
    trip,
    people: formPeople(members, guests, currentUserId),
    me,
    initial,
    defaultSpentOn,
    onSubmit,
  });
  const amountRef = useRef<HTMLInputElement>(null);
  return (
    <form
      onSubmit={form.submit}
      className="fixed inset-0 z-30 flex flex-col bg-background lg:static lg:z-auto lg:mx-auto lg:w-full lg:max-w-110 lg:flex-1"
    >
      <header className="flex h-14 shrink-0 items-center gap-3.5 px-4.5">
        <button type="button" aria-label="닫기" onClick={onClose} className="flex text-ink-900">
          <X className="size-6.5" />
        </button>
        <h1 className="flex-1 text-[17px] font-bold text-ink-900">{title}</h1>
        {headerRight}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-visible">
        <AmountField form={form} inputRef={amountRef} autoFocus={!initial} />
        <div className="relative flex flex-col gap-7 px-5 pt-6 pb-8">
          <CategoryField form={form} />
          <DayField form={form} trip={trip} />
          <LinkField form={form} trip={trip} items={items} />
          <NameField form={form} />
          <PaymentField form={form} />
          <PeopleSection form={form} />
          <MoreFields form={form} />
          {!initial && form.numAmount <= 0 && (
            <AmountFirst onClick={() => amountRef.current?.focus()} />
          )}
        </div>
      </div>
      <SubmitBar form={form} pending={pending} submitError={submitError} />
    </form>
  );
}

type AmountFirstProps = { onClick: () => void };

/** 금액을 넣기 전 아래 칸을 덮는 흰 막 — 「금액을 먼저 입력해 주세요」, 누르면 금액 칸으로 */
function AmountFirst({ onClick }: AmountFirstProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-0 z-10 flex justify-center bg-white/70 pt-5"
    >
      <span className="sticky top-5 flex h-8 items-center rounded-full bg-ink-900 px-3.5 text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,.15)]">
        금액을 먼저 입력해 주세요
      </span>
    </button>
  );
}

type SubmitBarProps = {
  form: ExpenseFormState;
  pending?: boolean;
  submitError?: string | null;
};

/** 아래 고정 줄 — 빠진 필수 칸 안내(주황) · 저장 오류 · 완료 버튼. 필수 칸이 비면 버튼을 끈다 */
function SubmitBar({ form, pending, submitError }: SubmitBarProps) {
  const message = form.missing || form.error || submitError;
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-surface-muted bg-background px-5 pt-2.5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] lg:sticky lg:bottom-0">
      {message && (
        <p
          role={form.missing ? undefined : "alert"}
          className={
            form.missing
              ? "flex items-center justify-center gap-1.25 text-[13px] font-semibold text-status-wait-text"
              : "text-center text-[13px] font-semibold text-destructive"
          }
        >
          {form.missing && <CircleAlert className="size-3.5" aria-hidden="true" />}
          {message}
        </p>
      )}
      <Button type="submit" size="cta" disabled={!!form.missing || pending}>
        {pending ? "저장 중..." : "완료"}
      </Button>
    </div>
  );
}
