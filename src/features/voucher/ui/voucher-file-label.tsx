"use client";

import type { ReactNode } from "react";

import { VOUCHER_MIMES } from "@/entities/voucher";

type VoucherFileLabelProps = {
  /** 고른 파일 하나 */
  onPick: (file: File) => void;
  /** 만드는 중 — 다시 고르지 못하게 */
  disabled: boolean;
  /** 읽기 프로그램용 이름 */
  label?: string;
  className: string;
  children: ReactNode;
};

/** 누르면 바로 파일(사진 · PDF 하나)을 고르는 버튼 모양 label — 「+ 바우처」 원 · 「추가」 줄 칩이 쓴다 */
export function VoucherFileLabel({
  onPick,
  disabled,
  label,
  className,
  children,
}: VoucherFileLabelProps) {
  return (
    <label aria-label={label} aria-disabled={disabled || undefined} className={className}>
      <input
        type="file"
        accept={VOUCHER_MIMES.join(",")}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          // 같은 파일을 다시 골라도 바뀜이 일어나게 비운다
          e.target.value = "";
        }}
      />
      {children}
    </label>
  );
}
