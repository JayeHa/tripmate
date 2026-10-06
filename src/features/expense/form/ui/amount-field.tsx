import { Check, ChevronDown } from "lucide-react";
import { type RefObject, useLayoutEffect, useRef, useState } from "react";

import { currencyName, decimalsOf, formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import { caretAfter, digitsBefore, formatAmountDraft } from "../lib/amount-draft";
import type { ExpenseFormState } from "../model/use-expense-form";

type AmountFieldProps = {
  form: ExpenseFormState;
  inputRef: RefObject<HTMLInputElement | null>;
  autoFocus: boolean;
};

/**
 * 맨 위 금액 칸 — 가운데 큰 숫자(40/800, 쉼표) + 통화 이름, 오른쪽 통화 고르기(통화가 둘 이상일 때).
 * 밑줄은 비었을 때 블루, 채우면 회색. 기준 화폐가 아니면 아래에 「≈ 원화 · 엔 920 기준」.
 * 입력 칸 폭은 글자 수에 맞춘다 — 가운데 정렬에서 단위가 숫자에 붙어 있게.
 * 쉼표를 다시 넣으면 값이 통째로 바뀌어 커서가 끝으로 간다. 그래서 커서 앞의 숫자 수를 기억했다가 같은 자리로 돌려놓는다.
 * 소수 없는 통화(원 · 엔)는 점 키를 받지 않는다 — 붙여넣기용 「첫 점 뒤는 버린다」 규칙이 한 글자 타자에 걸려 뒤 숫자를 지우지 않게
 */
export function AmountField({ form, inputRef, autoFocus }: AmountFieldProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const text = formatAmountDraft(form.amount);
  const filled = form.numAmount > 0;
  // 방금 입력에서 커서 앞에 있던 숫자 수. 그린 뒤 한 번 쓰고 비운다
  const caret = useRef<number | null>(null);

  // 의존 배열 없이 매번 — 걸러진 글자를 쳐서 값이 그대로여도 React 가 값을 다시 넣어 커서가 끝으로 가기 때문
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (caret.current === null || !input) return;
    const at = caretAfter(input.value, caret.current);
    input.setSelectionRange(at, at);
    caret.current = null;
  });
  return (
    <div className="flex flex-col items-center gap-2.5 border-b-8 border-surface-sunken px-5 pt-6.5 pb-5.5">
      <label htmlFor="expense-amount" className="text-[13px] font-bold text-ink-400">
        금액
      </label>
      <div className="flex max-w-full items-center gap-2.5">
        <div
          className={cn(
            "flex min-w-0 items-baseline gap-1.5 border-b-2 pb-1.5 transition-colors",
            filled ? "border-line" : "border-primary",
          )}
        >
          <input
            ref={inputRef}
            id="expense-amount"
            inputMode={decimalsOf(form.currency) === 0 ? "numeric" : "decimal"}
            autoComplete="off"
            autoFocus={autoFocus}
            value={text}
            onKeyDown={(e) => {
              if (e.key === "." && decimalsOf(form.currency) === 0) e.preventDefault();
            }}
            onChange={(e) => {
              const { value, selectionStart } = e.target;
              caret.current = digitsBefore(value, selectionStart ?? value.length);
              form.setAmount(value);
            }}
            placeholder="0"
            style={{ width: `${Math.max(1, text.length) * 0.62 + 0.2}em` }}
            className="min-w-0 bg-transparent p-0 text-right text-[40px] font-extrabold tracking-tight text-ink-900 outline-none placeholder:text-ink-900"
          />
          <span className={cn("text-xl font-bold", filled ? "text-ink-900" : "text-line-dashed")}>
            {currencyName(form.currency)}
          </span>
        </div>
        {form.currencies.length > 1 && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-8 shrink-0 items-center gap-0.75 rounded-full bg-surface-muted pr-2.5 pl-3 text-[13px] font-bold text-ink-700"
          >
            {form.currency}({currencyName(form.currency)})
            <ChevronDown className="size-3.5 text-ink-450" aria-hidden="true" />
          </button>
        )}
      </div>
      {form.rateText && (
        <p className="text-center text-[13px] text-ink-500">
          {filled && form.homeAmount !== null && (
            <>
              ≈ <b className="text-ink-900">{formatMoney(form.homeAmount, form.home)}</b> ·{" "}
            </>
          )}
          {form.rateText}
        </p>
      )}
      <SheetDialog open={sheetOpen} onClose={() => setSheetOpen(false)} title="통화 선택">
        {form.currencies.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => {
              form.setCurrency(code);
              setSheetOpen(false);
            }}
            className={cn(
              "flex h-13.5 w-full items-center text-[17px] font-bold",
              code === form.currency ? "text-primary" : "text-ink-900",
            )}
          >
            <span className="flex-1 text-left">
              {code}({currencyName(code)})
            </span>
            {code === form.currency && <Check className="size-6" aria-hidden="true" />}
          </button>
        ))}
      </SheetDialog>
    </div>
  );
}
