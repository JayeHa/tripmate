"use client";

import { CloudOff, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useDeleteExpense } from "@/entities/expense";
import { DeleteExpenseConfirm } from "@/features/expense/form";
import { saveErrorText } from "@/shared/api/sync";
import { NAV } from "@/shared/lib/nav-transition";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

import { useExpenseDetail } from "../model/use-expense-detail";
import { DetailBody } from "./detail-body";

type ExpenseDetailViewProps = { tripId: string; expenseId: string };

/**
 * 비용 상세(조회) — 가계부에서 비용을 누르면 먼저 여기. 아래 「삭제 | ✎ 수정」, ✕ 는 가계부로.
 * 지우면 확인 창을 거쳐 가계부로 가고, 「수정」 은 입력 화면(닫거나 저장하면 이 화면으로 돌아온다).
 * 수정 화면과는 기록을 바꿔치기(replace)로 오간다 — 상세 → 수정 → 상세 뒤 「뒤로」 가 상세를 한 번 더 보이지 않고 가계부로 가게
 * 큰 화면에서는 비용 입력 페이지처럼 가운데 440 으로 그린다
 */
export function ExpenseDetailView({ tripId, expenseId }: ExpenseDetailViewProps) {
  const router = useRouter();
  const list = `/trips/${tripId}/expenses`;
  const detail = useExpenseDetail(tripId, expenseId);
  const remove = useDeleteExpense(tripId);
  // 지운 뒤 가계부로 가는 동안 「찾을 수 없어요」 가 비치지 않게. 삭제는 다시 읽기(invalidate)가 끝나야 성공이 되므로
  // 그 전에 다시 읽은 목록 · 실시간 갱신에서 지출이 먼저 빠질 수 있다 — 요청 중에 사라진 것도 지운 것으로 본다
  if (remove.isSuccess || (remove.isPending && detail.state === "missing")) return null;
  return (
    <div className="fixed inset-x-0 top-(--offline-band) bottom-0 z-30 flex flex-col bg-background lg:static lg:z-auto lg:mx-auto lg:w-full lg:max-w-110 lg:flex-1">
      <header className="flex h-14 shrink-0 items-center gap-3.5 px-4.5">
        <Link
          href={list}
          transitionTypes={NAV.back}
          aria-label="닫기"
          className="flex text-ink-900"
        >
          <X className="size-6.5" />
        </Link>
        <h1 className="flex-1 text-[17px] font-bold text-ink-900">비용 상세</h1>
      </header>
      {detail.state === "failed" && (
        <EmptyState
          icon={CloudOff}
          title="비용을 불러오지 못했어요"
          description="인터넷 연결을 확인하고 다시 시도해 주세요."
          action={
            <Button variant="outline" size="form" onClick={detail.retry}>
              다시 시도
            </Button>
          }
          className="flex-1 justify-center py-20"
        />
      )}
      {detail.state === "missing" && (
        <p className="p-4 text-sm text-muted-foreground">지출을 찾을 수 없어요.</p>
      )}
      {detail.state === "ready" && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-visible">
            <DetailBody
              expense={detail.expense}
              row={detail.row}
              trip={detail.trip}
              receipts={detail.receipts}
              avatarUrlOf={detail.avatarUrlOf}
            />
          </div>
          <div className="flex shrink-0 flex-col gap-2 border-t border-surface-muted bg-background px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] lg:sticky lg:bottom-0">
            {remove.isError && (
              <p role="alert" className="text-center text-[13px] text-destructive">
                {saveErrorText(remove.error, "삭제하지 못했어요. 다시 시도해 주세요.")}
              </p>
            )}
            <div className="flex gap-2">
              <DeleteExpenseConfirm
                onDelete={() =>
                  remove.mutate(expenseId, {
                    onSuccess: () => router.replace(list, { transitionTypes: NAV.back }),
                  })
                }
                disabled={remove.isPending}
                className={cn(
                  buttonVariants({ variant: "chip", size: "cta" }),
                  "flex-1 text-destructive",
                )}
              >
                삭제
              </DeleteExpenseConfirm>
              <Link
                href={`${list}/${expenseId}/edit`}
                transitionTypes={NAV.forward}
                replace
                aria-disabled={remove.isPending}
                className={cn(
                  buttonVariants({ size: "cta" }),
                  "flex-2 aria-disabled:pointer-events-none aria-disabled:opacity-50",
                )}
              >
                <Pencil className="size-4.25" aria-hidden="true" />
                수정
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
