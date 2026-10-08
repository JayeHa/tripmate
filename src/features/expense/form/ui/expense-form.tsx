"use client";

import { X } from "lucide-react";
import { useRef } from "react";

import {
  type ExpenseFormValues,
  type ExpenseReceipt,
  personKey,
  type ReceiptChange,
  type TripGuest,
} from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import type { TripMember } from "@/entities/trip-member";

import { formPeople } from "../lib/people";
import { useExpenseForm } from "../model/use-expense-form";
import { useReceiptDrafts } from "../model/use-receipt-drafts";
import { AmountField, AmountFirst } from "./amount-field";
import { NameField, PaymentField } from "./expense-fields";
import { FormMoreMenu } from "./form-more-menu";
import { MoreFields } from "./more-fields";
import { PeopleSection } from "./people-section";
import { QuickSummary } from "./quick-summary";
import { ReceiptsField } from "./receipts-field";
import { ScheduleFields } from "./schedule-fields";
import { SubmitBar } from "./submit-bar";

/** 붙어 있던 영수증이 없을 때 — 렌더마다 새 배열을 만들지 않게 */
const NO_RECEIPTS: ExpenseReceipt[] = [];

/** 일정 · 대체 장소 줄에서 그 id 를 찾는다. id 가 없거나 못 찾으면 null */
function findItem(items: ScheduleItem[], id: string | undefined) {
  return id ? (items.find((i) => i.id === id) ?? null) : null;
}

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
  currentUserId: string;
  initial?: ExpenseFormValues;
  /** 새 지출의 처음 날짜 — ""(여행준비) 또는 yyyy-MM-dd */
  defaultSpentOn?: string;
  pending?: boolean;
  /** 저장 요청이 실패한 이유 */
  submitError?: string | null;
  /** 이미 붙어 있던 영수증(수정) */
  receipts?: ExpenseReceipt[];
  /** 새 지출을 처음부터 이 일정(타임라인 일정 · 대체 장소)에 연결한다 — 일정 상세의 「+ 비용」 */
  presetItemId?: string;
  /** 빠른 입력(일정에서 연 비용) — 일정 연결 · 카테고리 · 날짜 칸을 숨기고 맨 위에 글로 요약한다. 가계부에서 열면 모든 칸 */
  quick?: boolean;
  /** 저장 — 수정이면 둘째 값이 폼을 연 때의 값, 셋째는 붙일 영수증 · 뗄 영수증 */
  onSubmit: (
    values: ExpenseFormValues,
    opened: ExpenseFormValues | undefined,
    receipts: ReceiptChange,
  ) => void;
};

/**
 * 비용 추가 · 수정 화면. 모바일은 탭 위를 덮는 전체 화면, PC 는 가운데 440 칸(페이지) 또는 부른 쪽의 창 안(모달).
 * 금액(맨 위) → 일정 연결 → 카테고리 → 날짜 → 항목명 → 결제수단 → 누가 내고 누구와 나눴나 → 추가 정보, 아래에 완료.
 * 새 비용은 금액을 넣기 전까지 아래 칸을 흐리게 덮고, 누르면 금액 칸으로 보낸다.
 * 빠른 입력은 연결된 일정이 있을 때만 — 일행이 일정을 지워 연결이 풀리면 모든 칸으로 돌아간다
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
  currentUserId,
  initial,
  defaultSpentOn,
  pending,
  submitError,
  receipts = NO_RECEIPTS,
  presetItemId,
  quick = false,
  onSubmit,
}: ExpenseFormProps) {
  const me = personKey({ kind: "member", id: currentUserId });
  const drafts = useReceiptDrafts(trip.id, receipts);
  const form = useExpenseForm({
    trip,
    people: formPeople(members, guests, currentUserId),
    me,
    items,
    alternatives,
    initial,
    defaultSpentOn,
    hasReceipts: receipts.length > 0,
    presetItem: findItem([...items, ...alternatives], presetItemId),
    onSubmit: (values, opened) => onSubmit(values, opened, drafts.change()),
  });
  const amountRef = useRef<HTMLInputElement>(null);
  const linked = quick ? form.link.linked : null;
  return (
    <form onSubmit={form.submit} className={FRAME[layout].form}>
      <header className="flex h-14 shrink-0 items-center gap-3.5 px-4.5">
        <button type="button" aria-label="닫기" onClick={onClose} className="flex text-ink-900">
          <X className="size-6.5" />
        </button>
        <h1 className="flex-1 text-[17px] font-bold text-ink-900">{title}</h1>
        {headerRight}
        <FormMoreMenu onRate={form.openRate} />
      </header>
      <div className={FRAME[layout].body}>
        {linked && <QuickSummary form={form} linked={linked} />}
        <AmountField form={form} inputRef={amountRef} autoFocus={!initial} />
        <div className="relative flex flex-col gap-7 px-5 pt-6 pb-8">
          <ScheduleFields
            form={form}
            trip={trip}
            items={items}
            alternatives={alternatives}
            quick={linked !== null}
          />
          <NameField form={form} />
          <PaymentField form={form} />
          <PeopleSection form={form} />
          <MoreFields form={form} receipts={<ReceiptsField tripId={trip.id} drafts={drafts} />} />
          {!initial && form.numAmount <= 0 && (
            <AmountFirst onClick={() => amountRef.current?.focus()} />
          )}
        </div>
      </div>
      <SubmitBar
        form={form}
        // 영수증을 올리는 동안은 저장하지 않는다 — 올라가지 않은 파일이 붙지 않은 채 남는다
        pending={Boolean(pending) || drafts.uploading}
        submitError={drafts.uploading ? "영수증을 올리는 중이에요" : submitError}
        className={FRAME[layout].bar}
      />
    </form>
  );
}
