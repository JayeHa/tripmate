"use client";

import { FileText, Loader2, Plus, X } from "lucide-react";
import { useRef } from "react";

import { RECEIPT_MAX_COUNT, RECEIPT_MIMES, useReceiptUrls } from "@/entities/expense";

import type { ReceiptDraft, ReceiptDrafts } from "../model/use-receipt-drafts";

type ReceiptsFieldProps = { tripId: string; drafts: ReceiptDrafts };

/**
 * 「영수증」 칸 — 96 칸 사진 · PDF 묶음(각각 ✕ 로 빼기)과 점선 「+ 사진 · PDF」. 여러 장을 한 번에 고른다.
 * 올리는 동안은 칸에 도는 표시, 붙어 있던 사진은 저장소의 읽기 주소로 보인다
 */
export function ReceiptsField({ tripId, drafts }: ReceiptsFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const keys = drafts.items.flatMap((d) =>
    d.key && !d.preview && d.mime !== "application/pdf" ? [d.key] : [],
  );
  const { data: urls = {} } = useReceiptUrls(tripId, keys);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-ink-400">영수증 (선택 · {RECEIPT_MAX_COUNT}장까지)</span>
      <div className="flex flex-wrap gap-2">
        {drafts.items.map((d) => (
          <Thumb
            key={d.uid}
            draft={d}
            url={d.preview ?? (d.key ? urls[d.key] : undefined)}
            onRemove={() => drafts.remove(d.uid)}
          />
        ))}
        {!drafts.full && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex size-24 flex-col items-center justify-center gap-1 rounded-button border-[1.5px] border-dashed border-line-dashed text-[13px] font-bold text-primary"
          >
            <Plus aria-hidden="true" className="size-5" />
            사진 · PDF
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept={RECEIPT_MIMES.join(",")}
        className="hidden"
        onChange={(e) => {
          drafts.add(Array.from(e.target.files ?? []));
          // 같은 파일을 다시 골라도 바뀜이 일어나게 비운다
          e.target.value = "";
        }}
      />
      {drafts.error && (
        <p role="alert" className="text-[13px] text-destructive">
          {drafts.error}
        </p>
      )}
    </div>
  );
}

type ThumbProps = { draft: ReceiptDraft; url: string | undefined; onRemove: () => void };

/** 영수증 한 칸 — 사진은 꽉 채워, PDF 는 문서 아이콘 + 이름. 오른쪽 위 ✕ */
function Thumb({ draft, url, onRemove }: ThumbProps) {
  const pdf = draft.mime === "application/pdf";
  return (
    <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-button border border-line bg-surface-muted">
      {!pdf && url && (
        // 서명 주소(1시간) · 기기 미리 보기(blob:)라 next/image 최적화를 거치지 않는다
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={draft.name} className="absolute inset-0 size-full object-cover" />
      )}
      {pdf && (
        <span className="flex flex-col items-center gap-1 px-1.5 text-center">
          <FileText aria-hidden="true" className="size-6 text-ink-350" />
          <span className="line-clamp-2 text-[11px] break-all text-ink-500">{draft.name}</span>
        </span>
      )}
      {!draft.key && (
        <span className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Loader2 aria-label="올리는 중" className="size-5 animate-spin text-ink-500" />
        </span>
      )}
      <button
        type="button"
        aria-label={`${draft.name} 빼기`}
        onClick={onRemove}
        className="absolute top-1 right-1 flex size-5.5 items-center justify-center rounded-full bg-ink-900/70"
      >
        <X className="size-3.5 text-white" strokeWidth={2.6} />
      </button>
    </div>
  );
}
