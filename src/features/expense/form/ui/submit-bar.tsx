import { CircleAlert } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type { ExpenseFormState } from "../model/use-expense-form";

type SubmitBarProps = {
  form: ExpenseFormState;
  className?: string;
  pending?: boolean;
  submitError?: string | null;
};

/** 아래 고정 줄 — 빠진 필수 칸 안내(주황) · 저장 오류 · 완료 버튼. 필수 칸이 비면 버튼을 끈다 */
export function SubmitBar({ form, pending, submitError, className }: SubmitBarProps) {
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
