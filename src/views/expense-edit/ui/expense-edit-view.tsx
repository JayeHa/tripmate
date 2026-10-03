"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { ExpenseForm } from "@/features/expense-form";
import { Button } from "@/shared/ui/button";
import { useDeleteExpense, useExpenses, useUpdateExpense } from "@/entities/expense";
import { useScheduleItems } from "@/entities/schedule-item";
import { useTrip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { useUser } from "@/entities/session";
import type { ExpenseFormValues } from "@/entities/expense";
import type { ExpenseCategory } from "@/entities/expense";

export function ExpenseEditView({ tripId, expenseId }: { tripId: string; expenseId: string }) {
  const router = useRouter();
  const { data: trip } = useTrip(tripId);
  const { data: members } = useTripMembers(tripId);
  const { data: items } = useScheduleItems(tripId);
  const { data: expenses } = useExpenses(tripId);
  const { data: user } = useUser();
  const update = useUpdateExpense(tripId);
  const remove = useDeleteExpense(tripId);

  const expense = expenses?.find((e) => e.id === expenseId);
  const back = `/trips/${tripId}/expenses`;

  const initial: ExpenseFormValues | undefined = expense && {
    amount: Number(expense.amount),
    currency: expense.currency,
    payer_id: expense.payer_id,
    participant_ids: expense.splits.map((s) => s.user_id),
    split_mode: expense.split_mode as "equal" | "custom",
    custom_shares:
      expense.split_mode === "custom"
        ? Object.fromEntries(expense.splits.map((s) => [s.user_id, Number(s.share)]))
        : undefined,
    category: expense.category as ExpenseCategory,
    memo: expense.memo ?? undefined,
    spent_on: expense.spent_on,
    schedule_item_id: expense.schedule_item_id,
  };

  return (
    <>
      <AppHeader
        title="지출 편집"
        back={back}
        right={
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="ghost" size="icon" aria-label="삭제" />}>
              <Trash2 />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>이 지출을 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>정산 내역에서도 제거돼요.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    remove.mutate(expenseId, { onSuccess: () => router.replace(back) })
                  }
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />
      <main className="flex-1 p-4">
        {expenses && !expense && (
          <p className="text-sm text-muted-foreground">지출을 찾을 수 없어요.</p>
        )}
        {trip && members && user && initial && (
          <ExpenseForm
            key={expense?.updated_at}
            trip={trip}
            members={members}
            items={items}
            currentUserId={user.id}
            initial={initial}
            submitLabel="저장"
            pending={update.isPending}
            onSubmit={(values) =>
              update.mutate({ expenseId, values }, { onSuccess: () => router.replace(back) })
            }
          />
        )}
        {update.error && <p className="mt-3 text-sm text-destructive">{update.error.message}</p>}
      </main>
    </>
  );
}
