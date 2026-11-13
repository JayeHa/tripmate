"use client";

import type { Voucher } from "@/entities/voucher";
import { cn } from "@/shared/lib/utils";

import { useVoucherUsedToggle } from "../model/use-voucher-used";

/** 놓이는 자리마다 크기 — 모바일 상세 아래 줄(52 · 15) · PC 칸 머리(32 · 13) */
const SIZE = {
  bar: "h-13 px-4 text-[15px]",
  head: "h-8 px-3 text-[13px]",
};

type VoucherUsedToggleProps = {
  tripId: string;
  voucher: Pick<Voucher, "id" | "used_at">;
  size: keyof typeof SIZE;
  onToast: (text: string) => void;
};

/**
 * 바우처 상세의 사용 토글 — 안 썼으면 흰 「사용했어요」, 썼으면 초록 「✓ 사용함」. 한 번 더 누르면 되돌린다.
 * 뷰어 아래 버튼과 같은 값을 바꾼다
 */
export function VoucherUsedToggle({ tripId, voucher, size, onToast }: VoucherUsedToggleProps) {
  const toggle = useVoucherUsedToggle(tripId, onToast);
  const used = voucher.used_at !== null;
  return (
    <button
      type="button"
      aria-pressed={used}
      onClick={() => toggle(voucher)}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-button border font-bold",
        SIZE[size],
        used
          ? "border-visited-line bg-visited-soft text-visited-text"
          : "border-line-strong bg-white text-ink-900 hover:bg-surface-sunken",
      )}
    >
      {used ? "✓ 사용함" : "사용했어요"}
    </button>
  );
}
