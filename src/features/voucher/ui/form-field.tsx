import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  /** 이름 옆 회색 괄호 글자(예: 「선택」) */
  hint?: string;
  children: ReactNode;
};

/** 칸 — 13/700 이름(옆에 회색 괄호 안내) + 입력 */
export function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold text-ink-700">
        {label}
        {hint && <span className="font-medium text-ink-350"> ({hint})</span>}
      </span>
      {children}
    </div>
  );
}
