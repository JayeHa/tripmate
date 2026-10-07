"use client";

import { Trash2 } from "lucide-react";

import {
  type ExpenseFormValues,
  formValuesOf,
  useCreateExpense,
  useDeleteExpense,
  useUpdateExpense,
} from "@/entities/expense";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { AppHeader } from "@/shared/ui/app-header";

import { useExpenseFormData } from "../model/use-expense-form-data";
import { ExpenseForm, type ExpenseFormLayout } from "./expense-form";
import { FormLoadError } from "./form-load-error";

type EditorCommon = {
  tripId: string;
  layout?: ExpenseFormLayout;
  /** ✕ — 저장하지 않고 닫는다 */
  onClose: () => void;
  /** 저장 · 삭제가 끝났다 */
  onDone: () => void;
  /** 페이지일 때 머리의 뒤로 가기(읽기 실패 · 못 찾음 안내). 모달은 창의 ✕ 가 대신해 비운다 */
  back?: string;
};

type CreateExpenseProps = EditorCommon & {
  /** 새 비용의 처음 날짜 — ""(여행준비) 또는 yyyy-MM-dd */
  defaultSpentOn?: string;
};

/**
 * 비용 추가 — 정산 인원 · 일정 · 대체 장소까지 읽은 뒤 폼을 연다(useExpenseFormData). 모바일 · 주소로 연 페이지와 PC 목록의 창이 같이 쓴다
 */
export function CreateExpense({
  tripId,
  layout,
  onClose,
  onDone,
  back,
  defaultSpentOn,
}: CreateExpenseProps) {
  const loaded = useExpenseFormData(tripId);
  const create = useCreateExpense(tripId);
  if (loaded.failed) return <FormLoadError title="비용 추가" back={back} onRetry={loaded.retry} />;
  if (!loaded.data) return null;
  const { currentUserId } = loaded.data;
  return (
    <ExpenseForm
      title="비용 추가"
      layout={layout}
      onClose={onClose}
      {...loaded.data}
      defaultSpentOn={defaultSpentOn}
      pending={create.isPending}
      submitError={create.error?.message}
      onSubmit={(values) =>
        create.mutate({ values, createdBy: currentUserId }, { onSuccess: onDone })
      }
    />
  );
}

type EditExpenseProps = EditorCommon & { expenseId: string };

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
}: EditExpenseProps) {
  const loaded = useExpenseFormData(tripId);
  const update = useUpdateExpense(tripId);
  const remove = useDeleteExpense(tripId);
  const expenses = loaded.data?.expenses;
  const expense = expenses?.find((e) => e.id === expenseId);
  const initial: ExpenseFormValues | undefined = expense && formValuesOf(expense);

  if (expenses && !expense)
    return (
      <>
        {back && <AppHeader title="비용 수정" back={back} />}
        <p className="p-4 text-sm text-muted-foreground">지출을 찾을 수 없어요.</p>
      </>
    );
  if (loaded.failed) return <FormLoadError title="비용 수정" back={back} onRetry={loaded.retry} />;
  if (!loaded.data || !initial) return null;
  return (
    <ExpenseForm
      key={expenseId}
      title="비용 수정"
      layout={layout}
      onClose={onClose}
      headerRight={
        <DeleteButton onDelete={() => remove.mutate(expenseId, { onSuccess: onDone })} />
      }
      {...loaded.data}
      expenseId={expenseId}
      initial={initial}
      pending={update.isPending}
      submitError={update.error?.message ?? remove.error?.message}
      onSubmit={(values, opened) =>
        update.mutate({ expenseId, values, opened: opened ?? initial }, { onSuccess: onDone })
      }
    />
  );
}

type DeleteButtonProps = { onDelete: () => void };

/** 머리 오른쪽 「삭제」 — 연한 빨강 칩, 누르면 확인 창 */
function DeleteButton({ onDelete }: DeleteButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className="flex h-8.5 items-center gap-1 rounded-button bg-destructive-soft px-2.5 text-sm font-bold text-destructive">
        <Trash2 className="size-4.5" aria-hidden="true" />
        삭제
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>이 지출을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>정산 내역에서도 제거돼요.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={onDelete}>
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
