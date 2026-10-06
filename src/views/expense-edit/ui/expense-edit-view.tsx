"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  type ExpenseFormValues,
  formValuesOf,
  useDeleteExpense,
  useExpenses,
  useTripGuests,
  useUpdateExpense,
} from "@/entities/expense";
import { useScheduleItems } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { useTrip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { ExpenseForm } from "@/features/expense/form";
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

type ExpenseEditViewProps = { tripId: string; expenseId: string };

/**
 * 비용 수정. 폼은 지출 id 를 key 로 둔다 — 일행이 같은 지출을 고쳐 실시간으로 다시 읽어도 쓰던 값이 처음 값으로 돌아가지 않는다.
 * 대신 폼이 연 때의 값을 들고 있다가 달라진 칸만 보낸다 — 그사이 일행이 바꾼 칸을 되돌리지 않게
 */
export function ExpenseEditView({ tripId, expenseId }: ExpenseEditViewProps) {
  const router = useRouter();
  const { data: trip } = useTrip(tripId);
  const { data: members } = useTripMembers(tripId);
  const { data: guests } = useTripGuests(tripId);
  const { data: items } = useScheduleItems(tripId);
  const { data: expenses } = useExpenses(tripId);
  const { data: user } = useUser();
  const update = useUpdateExpense(tripId);
  const remove = useDeleteExpense(tripId);

  const expense = expenses?.find((e) => e.id === expenseId);
  const back = `/trips/${tripId}/expenses`;

  const initial: ExpenseFormValues | undefined = expense && formValuesOf(expense);

  if (expenses && !expense)
    return (
      <>
        <AppHeader title="비용 수정" back={back} />
        <p className="p-4 text-sm text-muted-foreground">지출을 찾을 수 없어요.</p>
      </>
    );
  if (!trip || !members || !guests || !user || !initial) return null;
  return (
    <ExpenseForm
      key={expenseId}
      title="비용 수정"
      onClose={() => router.push(back)}
      headerRight={
        <DeleteButton
          onDelete={() => remove.mutate(expenseId, { onSuccess: () => router.replace(back) })}
        />
      }
      trip={trip}
      members={members}
      guests={guests}
      items={items}
      currentUserId={user.id}
      initial={initial}
      pending={update.isPending}
      submitError={update.error?.message ?? remove.error?.message}
      onSubmit={(values, opened) =>
        update.mutate(
          { expenseId, values, opened: opened ?? initial },
          { onSuccess: () => router.replace(back) },
        )
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
