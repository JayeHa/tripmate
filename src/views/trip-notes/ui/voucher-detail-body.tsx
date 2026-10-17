"use client";

import { FileText, Maximize2, QrCode } from "lucide-react";

import { isPdf } from "@/entities/voucher";
import { NumberCopyRow } from "@/features/voucher";

import type { VoucherDetail } from "../model/use-voucher-detail";

type VoucherDetailBodyProps = {
  detail: VoucherDetail;
  /** 썸네일을 눌렀다 — 뷰어를 연다 */
  onShow: () => void;
};

/**
 * 바우처 상세의 내용(모바일 페이지 · PC 칸 공통) — 위 줄(썸네일 132 · 제목 22/800 · 파일 정보 · 주인),
 * 번호 줄(내 것 → 모두 → 일행 것, 누르면 복사), 정보 표(연결된 일정 · 사용일 · 예약 사이트 · 메모, 비면 「없음」)
 */
export function VoucherDetailBody({ detail, onShow }: VoucherDetailBodyProps) {
  const { voucher: v } = detail;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <Thumb detail={detail} onShow={onShow} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
          <h2 className="text-[22px] font-extrabold tracking-[-0.01em] wrap-break-word text-ink-900">
            {v.title}
          </h2>
          {detail.fileInfo && <p className="text-[13px] text-ink-400">{detail.fileInfo}</p>}
          <p className="text-[13px] font-bold text-primary">{detail.owners}</p>
        </div>
      </div>
      {detail.numbers.length > 0 && (
        <div className="flex flex-col gap-2">
          {detail.numbers.map((n) => (
            <NumberCopyRow key={n.key} label={n.text} value={n.value} mine={n.mine} />
          ))}
        </div>
      )}
      <dl>
        <InfoRow label="연결된 일정" value={detail.target} />
        <InfoRow label="사용일" value={detail.date} />
        <InfoRow
          label="예약 사이트"
          value={[v.site_title, v.site_url].filter(Boolean).join("\n") || null}
        />
        <InfoRow label="메모" value={v.memo || null} />
      </dl>
    </div>
  );
}

type ThumbProps = { detail: VoucherDetail; onShow: () => void };

/** 썸네일 132 · r12(그림이 없으면 아이콘 — PDF 는 문서, 그 밖은 QR) — 오른쪽 아래 ⤢ 원, 누르면 뷰어 */
function Thumb({ detail, onShow }: ThumbProps) {
  return (
    <button
      type="button"
      aria-label="크게 보기"
      onClick={onShow}
      className="relative flex size-33 shrink-0 items-center justify-center overflow-hidden rounded-card border border-line bg-[#eef1f5]"
    >
      {detail.thumb ? (
        // 서명 주소라 next/image 최적화를 거치지 않는다
        // eslint-disable-next-line @next/next/no-img-element
        <img src={detail.thumb} alt="" className="size-full object-cover" />
      ) : (
        <ThumbIcon pdf={isPdf(detail.voucher)} />
      )}
      <span className="absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-full bg-ink-900/70">
        <Maximize2 className="size-3.5 text-white" aria-hidden="true" />
      </span>
    </button>
  );
}

type ThumbIconProps = { pdf: boolean };

/** 썸네일이 없을 때의 아이콘 52 */
function ThumbIcon({ pdf }: ThumbIconProps) {
  const className = "size-13 text-ink-900";
  if (pdf) return <FileText className={className} strokeWidth={1.4} aria-hidden="true" />;
  return <QrCode className={className} strokeWidth={1.4} aria-hidden="true" />;
}

type InfoRowProps = { label: string; value: string | null };

/** 정보 표 한 줄 — 라벨 84 · 14 회색, 값 14/600(줄바꿈 그대로), 비면 「없음」 */
function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex gap-3 border-t border-surface-muted py-3 text-sm">
      <dt className="w-21 shrink-0 text-ink-400">{label}</dt>
      <dd
        className={
          value
            ? "min-w-0 flex-1 font-semibold wrap-break-word whitespace-pre-line text-ink-900"
            : "flex-1 text-ink-350"
        }
      >
        {value ?? "없음"}
      </dd>
    </div>
  );
}
