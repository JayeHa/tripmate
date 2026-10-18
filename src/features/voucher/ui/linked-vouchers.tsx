"use client";

import { ChevronRight, FileText, Loader2, Plus, QrCode, Ticket } from "lucide-react";

import { isPdf, useVoucherUrls, type Voucher, type VoucherTargetRef } from "@/entities/voucher";

import { linkedSubText } from "../lib/voucher-view";
import { useQuickAddVoucher } from "../model/use-quick-add-voucher";
import { VoucherFileLabel } from "./voucher-file-label";

type LinkedVouchersProps = {
  tripId: string;
  /** 이 대상의 바우처(넣은 순서) */
  vouchers: Voucher[];
  /** 「+」 로 바로 만든 바우처의 연결 */
  target: VoucherTargetRef;
  /** 줄을 눌렀다 — 그 바우처의 뷰어 */
  onOpen: (voucher: Voucher) => void;
  onToast: (text: string) => void;
};

/**
 * 상세의 「바우처 N개」 칸 — 오른쪽 26 회색 원 「+」(누르면 파일을 골라 바로 만든다), 아래 줄(썸네일 44 · 제목 15/700 ·
 * 「PDF · 예약번호 …」 · ›). 바우처가 없으면 칸을 그리지 않는다(「추가」 줄의 칩으로)
 */
export function LinkedVouchers({ tripId, vouchers, target, onOpen, onToast }: LinkedVouchersProps) {
  const quick = useQuickAddVoucher(tripId, onToast);
  const thumbKeys = vouchers.flatMap((v) => (v.thumb_key ? [v.thumb_key] : []));
  const { data: urls = {} } = useVoucherUrls(tripId, thumbKeys);
  if (vouchers.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink-400">바우처 {vouchers.length}개</span>
        <VoucherFileLabel
          label="바우처 추가"
          disabled={quick.busy}
          onPick={(file) => quick.add(file, target)}
          className="flex size-6.5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-muted text-ink-500 hover:bg-line has-disabled:cursor-default"
        >
          {quick.busy ? (
            <Loader2 className="size-3.75 animate-spin" aria-label="올리는 중" />
          ) : (
            <Plus className="size-3.75" strokeWidth={2.2} aria-hidden="true" />
          )}
        </VoucherFileLabel>
      </div>
      <ul className="flex flex-col gap-2">
        {vouchers.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => onOpen(v)}
              className="flex w-full items-center gap-3 rounded-card border border-surface-muted bg-white py-2 pr-3 pl-2 text-left hover:bg-surface-sunken"
            >
              <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-button bg-[#eef1f5]">
                {v.thumb_key && urls[v.thumb_key] ? (
                  // 서명 주소라 next/image 최적화를 거치지 않는다
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[v.thumb_key]} alt="" className="size-full object-cover" />
                ) : (
                  <RowIcon voucher={v} />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15px] font-bold text-ink-900">{v.title}</span>
                {linkedSubText(v) && (
                  <span className="truncate text-xs text-ink-400">{linkedSubText(v)}</span>
                )}
              </span>
              <ChevronRight className="size-4.5 shrink-0 text-line-dashed" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

type RowIconProps = { voucher: Voucher };

/** 썸네일이 없을 때 — PDF 는 문서, 그 밖은 QR */
function RowIcon({ voucher }: RowIconProps) {
  const className = "size-5 text-[#aeb4bc]";
  if (isPdf(voucher)) return <FileText className={className} aria-hidden="true" />;
  return <QrCode className={className} aria-hidden="true" />;
}

type VoucherAddChipProps = {
  tripId: string;
  target: VoucherTargetRef;
  onToast: (text: string) => void;
};

/** 「추가」 줄의 바우처 칩(32 · r16) — 누르면 바로 파일을 골라 만든다. 만드는 동안 도는 표시 */
export function VoucherAddChip({ tripId, target, onToast }: VoucherAddChipProps) {
  const quick = useQuickAddVoucher(tripId, onToast);
  return (
    <VoucherFileLabel
      disabled={quick.busy}
      onPick={(file) => quick.add(file, target)}
      className="flex h-8 cursor-pointer items-center gap-1 rounded-full bg-surface-muted px-3 text-[13px] font-bold text-ink-700 hover:bg-line has-disabled:cursor-default"
    >
      {quick.busy ? (
        <Loader2 className="size-3.5 animate-spin text-ink-500" aria-label="올리는 중" />
      ) : (
        <Ticket className="size-3.5 text-ink-500" aria-hidden="true" />
      )}
      바우처
    </VoucherFileLabel>
  );
}
