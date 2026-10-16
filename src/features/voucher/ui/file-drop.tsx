"use client";

import { FileText, ImagePlus, Loader2 } from "lucide-react";

import { useVoucherUrls, type Voucher, VOUCHER_MIMES } from "@/entities/voucher";
import { cn } from "@/shared/lib/utils";

import type { VoucherFileState } from "../model/use-voucher-file";

type FileDropProps = {
  tripId: string;
  /** 고치는 바우처 — 붙어 있던 사진의 썸네일을 보인다 */
  voucher: Voucher | null;
  file: VoucherFileState;
  onPick: (file: File) => void;
};

/**
 * 원본 칸 — 점선 칸(r12, 비면 160 · 파일이 있으면 120)을 누르면 파일을 고른다(사진 · 캡처 · PDF 하나, 다시 고르면 바뀐다).
 * 사진은 칸을 꽉 채워 보이고(그리지 못하면 이름), PDF 는 문서 아이콘 + 파일 이름. 올리는 동안 도는 표시
 */
export function FileDrop({ tripId, voucher, file, onPick }: FileDropProps) {
  const thumbKey = !file.picked && voucher?.thumb_key ? [voucher.thumb_key] : [];
  const { data: urls = {} } = useVoucherUrls(tripId, thumbKey);
  const image = file.picked ? file.picked.preview : (urls[thumbKey[0] ?? ""] ?? null);
  const pdf = file.mime === "application/pdf";
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-card border-[1.5px] border-dashed border-line-dashed bg-surface-sunken p-3",
        file.name ? "min-h-30" : "min-h-40",
      )}
    >
      <input
        type="file"
        accept={VOUCHER_MIMES.join(",")}
        className="sr-only"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onPick(picked);
          // 같은 파일을 다시 골라도 바뀜이 일어나게 비운다
          e.target.value = "";
        }}
      />
      <FileHint pdf={pdf} name={file.name} />
      {image && !pdf && (
        // 서명 주소 · 기기 미리 보기(blob:)라 next/image 최적화를 거치지 않는다.
        // 브라우저가 못 그리는 사진(Chrome 의 HEIC)이면 숨겨서 아래 이름이 보이게 한다
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={image}
          src={image}
          alt={file.name ?? ""}
          onError={(e) => {
            e.currentTarget.hidden = true;
          }}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {file.uploading && (
        <span className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Loader2 aria-label="올리는 중" className="size-5 animate-spin text-ink-500" />
        </span>
      )}
    </label>
  );
}

type FileHintProps = { pdf: boolean; name: string | null };

/** 그림이 없을 때 칸 안 — 아이콘(PDF 는 문서) · 파일 이름(없으면 「파일 선택」) · 받는 종류 */
function FileHint({ pdf, name }: FileHintProps) {
  return (
    <>
      <FileHintIcon pdf={pdf} />
      <span className="max-w-full truncate text-sm font-bold text-ink-500">
        {name ?? "파일 선택"}
      </span>
      <span className="text-xs text-ink-350">사진 · 캡처 · PDF</span>
    </>
  );
}

type FileHintIconProps = { pdf: boolean };

/** PDF 는 문서, 그 밖은 사진 더하기 */
function FileHintIcon({ pdf }: FileHintIconProps) {
  if (pdf) return <FileText className="size-6.5 text-ink-400" aria-hidden="true" />;
  return <ImagePlus className="size-6.5 text-ink-400" aria-hidden="true" />;
}
