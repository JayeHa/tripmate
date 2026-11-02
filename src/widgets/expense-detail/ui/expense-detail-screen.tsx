"use client";

import { CloudOff, Pencil, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { useDeleteExpense } from "@/entities/expense";
import { DeleteExpenseConfirm } from "@/features/expense/form";
import { saveErrorText } from "@/shared/api/sync";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

import { useExpenseDetail } from "../model/use-expense-detail";
import { DetailBody } from "./detail-body";

/** 화면 틀 — page: 모바일 전체 화면 · PC 가운데 440 페이지, modal: 부른 쪽의 창(모바일 전체 화면) 안을 채운다 */
export type ExpenseDetailFrame = "page" | "modal";

const FRAME: Record<ExpenseDetailFrame, { root: string; body: string; bar: string }> = {
  page: {
    root: "fixed inset-x-0 top-(--offline-band) bottom-0 z-30 flex flex-col bg-background lg:static lg:z-auto lg:mx-auto lg:w-full lg:max-w-110 lg:flex-1",
    body: "min-h-0 flex-1 overflow-y-auto lg:overflow-visible",
    bar: "lg:sticky lg:bottom-0",
  },
  modal: {
    root: "flex h-full min-h-0 flex-col bg-background",
    body: "min-h-0 flex-1 overflow-y-auto",
    bar: "",
  },
};

type ExpenseDetailScreenProps = {
  tripId: string;
  expenseId: string;
  frame: ExpenseDetailFrame;
  /** ✕ — 가계부로(페이지) · 창 닫기(목록 위) */
  onClose: () => void;
  /** 「✎ 수정」 */
  onEdit: () => void;
  /** 지운 뒤 — 가계부로(페이지) · 창 닫기 */
  onDeleted: () => void;
  /** 그 비용이 없다(수정 창에서 지웠거나 일행이 지움) — 창이면 닫는다. 없으면 「찾을 수 없어요」 를 보인다 */
  onMissing?: () => void;
};

/**
 * 비용 상세(조회)의 화면 — 머리(✕ · 「비용 상세」) · 내용 · 아래 「삭제 | ✎ 수정」. 비용 상세 페이지와 모바일 가계부 목록 위의 창이 함께 쓴다.
 * 지우면 확인 창을 거친다. 지운 뒤 다른 곳으로 가는 동안 「찾을 수 없어요」 가 비치지 않게 그리지 않는다
 */
export function ExpenseDetailScreen({
  tripId,
  expenseId,
  frame,
  onClose,
  onEdit,
  onDeleted,
  onMissing,
}: ExpenseDetailScreenProps) {
  const detail = useExpenseDetail(tripId, expenseId);
  const remove = useDeleteExpense(tripId);
  const f = FRAME[frame];
  const missing = detail.state === "missing";
  // 한 번만 알린다 — 닫는 함수가 렌더마다 새로 만들어져도 두 번 닫지 않게
  const reported = useRef(false);
  useEffect(() => {
    if (!missing || reported.current) return;
    reported.current = true;
    onMissing?.();
  }, [missing, onMissing]);
  // 삭제는 다시 읽기(invalidate)가 끝나야 성공이 되므로, 그 전에 다시 읽은 목록 · 실시간 갱신에서 지출이 먼저 빠질 수 있다 — 요청 중에 사라진 것도 지운 것으로 본다
  if (remove.isSuccess || (remove.isPending && detail.state === "missing")) return null;
  return (
    <div className={f.root}>
      <header className="flex h-14 shrink-0 items-center gap-3.5 px-4.5">
        <button type="button" onClick={onClose} aria-label="닫기" className="flex text-ink-900">
          <X className="size-6.5" />
        </button>
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
          <div className={f.body}>
            <DetailBody
              expense={detail.expense}
              row={detail.row}
              trip={detail.trip}
              receipts={detail.receipts}
              avatarUrlOf={detail.avatarUrlOf}
            />
          </div>
          <div
            className={cn(
              "flex shrink-0 flex-col gap-2 border-t border-surface-muted bg-background px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
              f.bar,
            )}
          >
            {remove.isError && (
              <p role="alert" className="text-center text-[13px] text-destructive">
                {saveErrorText(remove.error, "삭제하지 못했어요. 다시 시도해 주세요.")}
              </p>
            )}
            <div className="flex gap-2">
              <DeleteExpenseConfirm
                onDelete={() => remove.mutate(expenseId, { onSuccess: onDeleted })}
                disabled={remove.isPending}
                className={cn(
                  buttonVariants({ variant: "chip", size: "cta" }),
                  "flex-1 text-destructive",
                )}
              >
                삭제
              </DeleteExpenseConfirm>
              <button
                type="button"
                onClick={onEdit}
                disabled={remove.isPending}
                className={cn(buttonVariants({ size: "cta" }), "flex-2")}
              >
                <Pencil className="size-4.25" aria-hidden="true" />
                수정
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
