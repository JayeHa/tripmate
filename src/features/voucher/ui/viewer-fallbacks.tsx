"use client";

import { Copy, ExternalLink, FileText, QrCode } from "lucide-react";

import { isPdf, type Voucher } from "@/entities/voucher";

import type { ViewerNumber } from "../lib/voucher-view";
import { useCopied } from "../model/use-copied";

type NumberCardProps = { first: ViewerNumber; dateText: string | null };

/** 번호 카드(r20) — 라벨 13/700 · 첫 번호 32/800 · 날짜 · 「번호 복사」 */
export function NumberCard({ first, dateText }: NumberCardProps) {
  const { copied, copy } = useCopied();
  return (
    <div className="flex min-h-0 flex-1 items-center px-5 py-2">
      <div className="flex w-full flex-col items-center gap-2.5 rounded-[20px] bg-white px-6 py-7 text-center">
        <span className="text-[13px] font-bold text-ink-400">{first.text}</span>
        <span className="text-[32px] leading-tight font-extrabold tracking-wider break-all text-ink-900">
          {first.value}
        </span>
        {dateText && (
          <span className="w-full border-t border-surface-muted pt-2.5 text-[13px] text-ink-500">
            {dateText}
          </span>
        )}
        <button
          type="button"
          onClick={() => copy(first.value)}
          className="mt-1 flex h-10 items-center gap-1.5 rounded-full bg-surface-muted px-4 text-[13px] font-bold text-ink-700"
        >
          <Copy className="size-3.75" aria-hidden="true" />
          {copied ? "복사했어요" : "번호 복사"}
        </button>
      </div>
    </div>
  );
}

type NoImageProps = { voucher: Voucher; originalUrl: string | null };

/** 볼 그림이 없을 때 — 큰 아이콘(PDF 는 문서) · 안내, 그림이 없는 PDF 는 「원본 열기」 */
export function NoImage({ voucher, originalUrl }: NoImageProps) {
  const pdf = isPdf(voucher);
  const Icon = pdf ? FileText : QrCode;
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-5 py-2">
      <Icon className="size-27.5 text-ink-500" strokeWidth={1.2} aria-hidden="true" />
      <p className="text-center text-xs text-ink-350">
        {pdf ? "PDF 를 그림으로 만들지 못했어요" : "볼 파일이 없어요"}
      </p>
      {pdf && originalUrl && (
        <a
          href={originalUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-4 text-[13px] font-bold text-white"
        >
          <ExternalLink className="size-3.75" aria-hidden="true" />
          원본 열기
        </a>
      )}
    </div>
  );
}
