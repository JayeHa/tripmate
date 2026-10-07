"use client";

import { CircleAlert, X } from "lucide-react";
import { useRef } from "react";

import {
  type ExpenseFormValues,
  type ExpenseWithSplits,
  personKey,
  type TripGuest,
} from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import type { TripMember } from "@/entities/trip-member";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { linkCosts } from "../lib/link-costs";
import { formPeople } from "../lib/people";
import { type ExpenseFormState, useExpenseForm } from "../model/use-expense-form";
import { AmountField } from "./amount-field";
import { CategoryField, DayField, NameField, PaymentField } from "./expense-fields";
import { LinkField } from "./link-field";
import { MoreFields } from "./more-fields";
import { PeopleSection } from "./people-section";

/** 화면 틀 — page: 모바일 전체 화면 · PC 가운데 440 페이지, modal: 부른 쪽의 창(PC 440×760) 안을 채운다 */
export type ExpenseFormLayout = "page" | "modal";

const FRAME: Record<ExpenseFormLayout, { form: string; body: string; bar: string }> = {
  page: {
    form: "fixed inset-0 z-30 flex flex-col bg-background lg:static lg:z-auto lg:mx-auto lg:w-full lg:max-w-110 lg:flex-1",
    body: "min-h-0 flex-1 overflow-y-auto lg:overflow-visible",
    bar: "lg:sticky lg:bottom-0",
  },
  modal: {
    form: "flex h-full min-h-0 flex-col bg-background",
    body: "min-h-0 flex-1 overflow-y-auto",
    bar: "",
  },
};

type ExpenseFormProps = {
  /** 머리 제목 — 「비용 추가」 · 「비용 수정」 */
  title: string;
  layout?: ExpenseFormLayout;
  onClose: () => void;
  /** 머리 오른쪽(수정 화면의 삭제) */
  headerRight?: React.ReactNode;
  trip: Trip;
  members: TripMember[];
  guests: TripGuest[];
  /** 연결할 수 있는 일정 — 타임라인 일정과 대체 장소 줄 */
  items?: ScheduleItem[];
  alternatives?: ScheduleItem[];
  /** 여행의 비용 — 일정마다 이미 쓴 돈을 보이려고 */
  expenses?: ExpenseWithSplits[];
  /** 고치는 비용의 id — 이미 쓴 돈에서 뺀다 */
  expenseId?: string;
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
 * 비용 추가 · 수정 화면. 모바일은 탭 위를 덮는 전체 화면, PC 는 가운데 440 칸(페이지) 또는 부른 쪽의 창 안(모달).
 * 금액(맨 위) → 일정 연결 → 카테고리 → 날짜 → 항목명 → 결제수단 → 누가 내고 누구와 나눴나 → 추가 정보, 아래에 완료.
 * 새 비용은 금액을 넣기 전까지 아래 칸을 흐리게 덮고, 누르면 금액 칸으로 보낸다
 */
export function ExpenseForm({
  title,
  layout = "page",
  onClose,
  headerRight,
  trip,
  members,
  guests,
  items = [],
  alternatives = [],
  expenses = [],
  expenseId,
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
    items,
    alternatives,
    initial,
    defaultSpentOn,
    onSubmit,
  });
  const costs = linkCosts(expenses, trip.home_currency, trip.exchange_rates, expenseId);
  // 지금 날짜의 day 순번(0 부터). 여행준비(빈 글)면 null — 날짜 옵션의 첫 줄이 여행준비라 하나 뺀다
  const dayIndex = form.link.days.findIndex((o) => o.value === form.spentOn) - 1;
  const amountRef = useRef<HTMLInputElement>(null);
  return (
    <form onSubmit={form.submit} className={FRAME[layout].form}>
      <header className="flex h-14 shrink-0 items-center gap-3.5 px-4.5">
        <button type="button" aria-label="닫기" onClick={onClose} className="flex text-ink-900">
          <X className="size-6.5" />
        </button>
        <h1 className="flex-1 text-[17px] font-bold text-ink-900">{title}</h1>
        {headerRight}
      </header>
      <div className={FRAME[layout].body}>
        <AmountField form={form} inputRef={amountRef} autoFocus={!initial} />
        <div className="relative flex flex-col gap-7 px-5 pt-6 pb-8">
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
          <NameField form={form} />
          <PaymentField form={form} />
          <PeopleSection form={form} />
          <MoreFields form={form} />
          {!initial && form.numAmount <= 0 && (
            <AmountFirst onClick={() => amountRef.current?.focus()} />
          )}
        </div>
      </div>
      <SubmitBar
        form={form}
        pending={pending}
        submitError={submitError}
        className={FRAME[layout].bar}
      />
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
  className?: string;
  pending?: boolean;
  submitError?: string | null;
};

/** 아래 고정 줄 — 빠진 필수 칸 안내(주황) · 저장 오류 · 완료 버튼. 필수 칸이 비면 버튼을 끈다 */
function SubmitBar({ form, pending, submitError, className }: SubmitBarProps) {
  const message = form.missing || form.error || submitError;
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-2 border-t border-surface-muted bg-background px-5 pt-2.5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
        className,
      )}
    >
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
