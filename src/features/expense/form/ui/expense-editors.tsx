"use client";

import { Trash2 } from "lucide-react";

import {
  type Expense,
  type ExpenseFormValues,
  formValuesOf,
  type PaymentOwner,
  paymentOwnerOf,
  useDeleteExpense,
  useUpdateExpense,
} from "@/entities/expense";
import { useReportLock } from "@/shared/lib/use-dialog-state";

import { amountFromParam } from "../lib/amount-param";
import { spentOnFromParam } from "../lib/spent-on-param";
import { startCurrency } from "../lib/start-currency";
import { readLastCurrency } from "../model/last-currency";
import { useCreateSubmit } from "../model/use-create-submit";
import { useExpenseFormData } from "../model/use-expense-form-data";
import { DeleteExpenseConfirm } from "./delete-expense-confirm";
import { ExpenseForm, type ExpenseFormLayout } from "./expense-form";
import { EditorHeader, FormLoadError } from "./form-load-error";

type EditorCommon = {
  tripId: string;
  layout?: ExpenseFormLayout;
  /** ✕ — 저장하지 않고 닫는다 */
  onClose: () => void;
  /** 저장 · 삭제가 끝났다 */
  onDone: () => void;
  /** 저장 · 삭제 요청이 서버에 가 있는지(잠김) — 창은 그동안 닫히지 않게 막는다(닫으면 실패를 보일 곳이 없다).
   * 일정 상세 · 장소 입력 창의 onLockChange 와 같은 약속이다 */
  onLockChange?: (locked: boolean) => void;
  /** 페이지일 때 머리의 뒤로 가기(읽기 실패 · 못 찾음 안내). 창이면 비우고, 그 화면들에 ✕(onClose) 머리를 둔다 */
  back?: string;
  /** 빠른 입력 — 일정 상세에서 열었다(ExpenseForm 의 quick) */
  quick?: boolean;
  /** 짧은 알림(입력 칸 고정 · 풀기) — 부른 화면이 하나를 그린다 */
  onToast?: (text: string) => void;
};

type CreateExpenseProps = EditorCommon & {
  /** 처음부터 이 일정에 연결한다(일정 상세의 「+ 비용」) — 날짜 · 카테고리도 그 일정으로 */
  itemId?: string;
  /** 주소의 period(prep · 0-base 날) — 처음 날짜. 없거나 모르는 값이면 여행 첫날 */
  period?: string | null;
  /** 주소의 amount · currency — 처음 금액 · 통화(여행 홈 환율 계산기). 맞지 않는 값이면 평소처럼 */
  amount?: string | null;
  currency?: string | null;
  /** 이 숙소 · 항공편의 결제로 만든다(그 화면의 「+ 결제 추가」) — 날짜는 여행준비부터 */
  payFor?: PaymentOwner & { name: string };
};

/**
 * 비용 추가 — 정산 인원 · 일정 · 대체 장소까지 읽은 뒤 폼을 연다(useExpenseFormData). 모바일 · 주소로 연 페이지와 PC 목록의 창이 같이 쓴다.
 * 처음 날짜는 여행 기간으로 계산해야 해 여기서 정한다 — 여행을 못 읽으면 다른 데이터와 함께 실패 안내로 간다
 */
export function CreateExpense({
  tripId,
  layout,
  onClose,
  onDone,
  back,
  period = null,
  amount = null,
  currency = null,
  onLockChange,
  itemId,
  quick,
  payFor,
  onToast,
}: CreateExpenseProps) {
  const loaded = useExpenseFormData(tripId);
  const create = useCreateSubmit(tripId, onDone);
  useReportLock(create.locked, onLockChange);
  if (loaded.failed)
    return <FormLoadError title="비용 추가" back={back} onClose={onClose} onRetry={loaded.retry} />;
  if (!loaded.data) return null;
  const { trip, currentUserId } = loaded.data;
  const preset = amountFromParam(amount, currency, [
    trip.home_currency,
    ...Object.keys(trip.exchange_rates),
  ]);
  return (
    <ExpenseForm
      title="비용 추가"
      layout={layout}
      onClose={onClose}
      {...loaded.data}
      defaultSpentOn={payFor ? "" : spentOnFromParam(period, trip.start_date, trip.end_date)}
      presetItemId={itemId}
      defaultAmount={preset?.amount}
      defaultCurrency={
        preset?.currency ??
        startCurrency(
          [trip.home_currency, ...Object.keys(trip.exchange_rates)],
          readLastCurrency(trip.id),
          (loaded.data.expenses ?? []).map((e) => e.currency),
        )
      }
      quick={quick}
      payFor={payFor}
      onToast={onToast}
      pending={create.pending}
      submitError={create.error}
      onSubmit={(values, _opened, receipts) =>
        create.submit(
          values,
          receipts,
          currentUserId,
          payFor ? { kind: payFor.kind, id: payFor.id } : null,
        )
      }
    />
  );
}

type EditExpenseProps = EditorCommon & {
  expenseId: string;
  /** 삭제가 끝났다. 없으면 onDone — 모바일은 저장하면 상세로, 지우면 목록으로 간다 */
  onDeleted?: () => void;
};

/**
 * 비용 수정 — 머리 오른쪽에 「삭제」. 폼은 지출 id 를 key 로 둔다 — 일행이 같은 지출을 고쳐 실시간으로 다시 읽어도
 * 쓰던 값이 처음 값으로 돌아가지 않는다. 대신 폼이 연 때의 값을 들고 있다가 달라진 칸만 보낸다
 */
export function EditExpense({
  tripId,
  expenseId,
  layout,
  onClose,
  onDone,
  back,
  onLockChange,
  onDeleted,
  quick,
  onToast,
}: EditExpenseProps) {
  const loaded = useExpenseFormData(tripId);
  const update = useUpdateExpense(tripId);
  const remove = useDeleteExpense(tripId);
  useReportLock(update.isPending || remove.isPending, onLockChange);
  const expenses = loaded.data?.expenses;
  const expense = expenses?.find((e) => e.id === expenseId);
  const initial: ExpenseFormValues | undefined = expense && formValuesOf(expense);

  if (expenses && !expense)
    return (
      <>
        <EditorHeader title="비용 수정" back={back} onClose={onClose} />
        <p className="p-4 text-sm text-muted-foreground">지출을 찾을 수 없어요.</p>
      </>
    );
  if (loaded.failed)
    return <FormLoadError title="비용 수정" back={back} onClose={onClose} onRetry={loaded.retry} />;
  if (!loaded.data || !initial) return null;
  return (
    <ExpenseForm
      key={expenseId}
      title="비용 수정"
      layout={layout}
      onClose={onClose}
      headerRight={
        <DeleteExpenseConfirm
          onDelete={() => remove.mutate(expenseId, { onSuccess: onDeleted ?? onDone })}
          className="flex h-8.5 items-center gap-1 rounded-button bg-destructive-soft px-2.5 text-sm font-bold text-destructive"
        >
          <Trash2 className="size-4.5" aria-hidden="true" />
          삭제
        </DeleteExpenseConfirm>
      }
      {...loaded.data}
      initial={initial}
      initialPlace={expense?.place ?? null}
      quick={quick}
      payFor={payForOf(expense)}
      onToast={onToast}
      receipts={loaded.data.tripReceipts.filter((r) => r.expense_id === expenseId)}
      pending={update.isPending}
      submitError={update.error?.message ?? remove.error?.message}
      onSubmit={(values, opened, receipts) =>
        update.mutate(
          { expenseId, values, opened: opened ?? initial, receipts },
          { onSuccess: onDone },
        )
      }
    />
  );
}

/** 저장된 비용이 숙소 · 항공편의 결제면 그 요약(맨 위 「… 결제」), 아니면 undefined */
function payForOf(expense: Pick<Expense, "stay_id" | "flight_id" | "name"> | undefined) {
  const kind = expense && paymentOwnerOf(expense);
  return kind ? { kind, name: expense.name } : undefined;
}
