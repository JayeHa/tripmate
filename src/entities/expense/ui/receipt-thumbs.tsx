"use client";

import { FileText } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { ExpenseReceipt } from "../api/receipts";
import { useReceiptUrls } from "../model/use-expenses";

/** 칸 크기 — 모바일 상세 96 · PC 패널 56 */
const SIZE = { md: "size-24", sm: "size-14" } as const;

type ReceiptThumbsProps = {
  tripId: string;
  receipts: ExpenseReceipt[];
  size?: keyof typeof SIZE;
};

/**
 * 지출에 붙은 영수증 묶음(보기 전용) — 사진은 꽉 채운 칸, PDF 는 문서 아이콘 + 이름. 누르면 새 창에서 원본을 연다.
 * 주소는 서버가 발급한 읽기 주소(1시간)라 받기 전에는 빈 칸이다
 */
export function ReceiptThumbs({ tripId, receipts, size = "md" }: ReceiptThumbsProps) {
  const { data: urls = {} } = useReceiptUrls(
    tripId,
    receipts.map((r) => r.key),
  );
  return (
    <ul className="flex flex-wrap gap-2">
      {receipts.map((r) => {
        const url = urls[r.key];
        const pdf = r.mime === "application/pdf";
        return (
          <li key={r.id}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${r.name} 열기`}
              className={cn(
                "relative flex items-center justify-center overflow-hidden rounded-button border border-line bg-surface-muted",
                SIZE[size],
                !url && "pointer-events-none",
              )}
            >
              {!pdf && url && (
                // 서명 주소(1시간)라 next/image 최적화를 거치지 않는다
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
              )}
              {pdf && (
                <span className="flex flex-col items-center gap-1 px-1.5 text-center">
                  <FileText aria-hidden="true" className="size-6 text-ink-350" />
                  {size === "md" && (
                    <span className="line-clamp-2 text-[11px] break-all text-ink-500">
                      {r.name}
                    </span>
                  )}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
