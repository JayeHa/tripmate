import { ArrowRight } from "lucide-react";

import { itemName } from "@/entities/schedule-item";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import type { ExpenseLink } from "../model/use-expense-link";

type RelinkDialogProps = { link: ExpenseLink };

/**
 * 이미 연결된 비용을 다른 일정으로 바꿀 때 — 그 일정 기준으로 달라질 칸(날짜 · 카테고리 · 항목명)을 보이고
 * 「연결만 바꾸기」 · 「값도 바꾸기」 중 고른다. 바깥을 누르거나 Esc 면 바꾸지 않는다
 */
export function RelinkDialog({ link }: RelinkDialogProps) {
  const rows = link.pendingRows();
  return (
    <AlertDialog open={link.pending !== null} onOpenChange={(open) => !open && link.cancelRelink()}>
      {/* 긴 일정 이름이 칸을 넓히지 않게 — 그리드 열을 창 폭으로 묶어야 말줄임이 걸린다 */}
      <AlertDialogContent className="grid-cols-[minmax(0,1fr)]">
        <AlertDialogHeader>
          <AlertDialogTitle>변경된 일정으로 값을 바꿀까요?</AlertDialogTitle>
          <AlertDialogDescription>
            「{link.pending ? itemName(link.pending) : ""}」 기준으로 아래 값을 다시 채워요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {rows.length > 0 && (
          <ul className="flex flex-col rounded-memo bg-surface-sunken px-3 py-1">
            {rows.map((row) => (
              <li key={row.label} className="flex min-h-9 items-center gap-2 text-[13px]">
                <span className="w-11 shrink-0 text-ink-400">{row.label}</span>
                <span className="min-w-0 flex-1 truncate text-ink-350 line-through">
                  {row.from}
                </span>
                <ArrowRight className="size-3.25 shrink-0 text-ink-400" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate font-bold text-ink-900">{row.to}</span>
              </li>
            ))}
          </ul>
        )}
        <AlertDialogFooter>
          <Button
            type="button"
            variant="chip"
            size="form"
            className="flex-1"
            onClick={() => link.confirmRelink(false)}
          >
            연결만 바꾸기
          </Button>
          <Button
            type="button"
            size="form"
            className="flex-1"
            onClick={() => link.confirmRelink(true)}
          >
            값도 바꾸기
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
