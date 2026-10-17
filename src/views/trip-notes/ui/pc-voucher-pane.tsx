"use client";

import { Download, Ticket } from "lucide-react";

import type { Voucher } from "@/entities/voucher";
import { useVoucherDownload } from "@/features/voucher";

import { useVoucherDetail } from "../model/use-voucher-detail";
import { VoucherDetailBody } from "./voucher-detail-body";

type PcVoucherPaneProps = {
  tripId: string;
  /** 고른 바우처 id, 없으면 null */
  id: string | null;
  onEdit: (voucher: Voucher) => void;
  onToast: (text: string) => void;
};

/** 머리 버튼 — 32 · r8 · 1px 테두리 · 13/700 */
const HEAD_BUTTON =
  "flex h-8 items-center gap-1 rounded-button border border-line-strong px-3 text-[13px] font-bold text-ink-900 hover:bg-surface-sunken disabled:opacity-40";

/**
 * PC 바우처 오른쪽 칸 — 머리 60(「바우처 상세」 · 다운로드 · 수정) + 내용. 고른 것이 없거나 일행이 지웠으면 안내만
 */
export function PcVoucherPane({ tripId, id, onEdit, onToast }: PcVoucherPaneProps) {
  const detail = useVoucherDetail(tripId, id);
  const download = useVoucherDownload(tripId, onToast);
  return (
    <aside className="sticky top-(--shell-top) flex h-[calc(100dvh-var(--shell-top))] min-w-0 flex-1 flex-col bg-white">
      {detail ? (
        <>
          <div className="flex h-15 shrink-0 items-center gap-2 border-b border-surface-muted px-6">
            <h2 className="flex-1 text-[13px] font-bold text-ink-400">바우처 상세</h2>
            {detail.voucher.file_key && (
              <button
                type="button"
                disabled={download.busy}
                onClick={() => download.download(detail.voucher)}
                className={HEAD_BUTTON}
              >
                <Download className="size-3.5" aria-hidden="true" />
                다운로드
              </button>
            )}
            <button type="button" onClick={() => onEdit(detail.voucher)} className={HEAD_BUTTON}>
              수정
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <VoucherDetailBody detail={detail} />
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Ticket className="size-9 text-line-strong" aria-hidden="true" />
          <p className="text-sm text-ink-400">바우처를 고르면 여기에 자세히 보여요</p>
        </div>
      )}
    </aside>
  );
}
