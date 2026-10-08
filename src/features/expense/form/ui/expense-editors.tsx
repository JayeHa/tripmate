"use client";

import { Trash2 } from "lucide-react";
import { useEffect } from "react";

import {
  type ExpenseFormValues,
  formValuesOf,
  useCreateExpense,
  useDeleteExpense,
  useUpdateExpense,
} from "@/entities/expense";

import { spentOnFromParam } from "../lib/spent-on-param";
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
};

type CreateExpenseProps = EditorCommon & {
  /** 주소의 period(prep · 0-base 날) — 처음 날짜. 없거나 모르는 값이면 여행 첫날 */
  period?: string | null;
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
  onLockChange,
}: CreateExpenseProps) {
  const loaded = useExpenseFormData(tripId);
  const create = useCreateExpense(tripId);
  useReportLock(create.isPending, onLockChange);
  if (loaded.failed)
    return <FormLoadError title="비용 추가" back={back} onClose={onClose} onRetry={loaded.retry} />;
  if (!loaded.data) return null;
  const { trip, currentUserId } = loaded.data;
  return (
    <ExpenseForm
      title="비용 추가"
      layout={layout}
      onClose={onClose}
      {...loaded.data}
      defaultSpentOn={spentOnFromParam(period, trip.start_date, trip.end_date)}
      pending={create.isPending}
      submitError={create.error?.message}
      onSubmit={(values, _opened, receipts) =>
        create.mutate(
          { values, createdBy: currentUserId, receipts: receipts.attach },
          { onSuccess: onDone },
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
      expenseId={expenseId}
      initial={initial}
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

/** 잠김(요청 중)을 부른 쪽에 알린다 — 바뀔 때마다, 사라질 때는 false(저장이 끝나 창이 닫히며 언마운트될 때 true 로 남지 않게) */
function useReportLock(locked: boolean, onLockChange?: (locked: boolean) => void) {
  useEffect(() => {
    onLockChange?.(locked);
    return () => onLockChange?.(false);
  }, [locked, onLockChange]);
}
