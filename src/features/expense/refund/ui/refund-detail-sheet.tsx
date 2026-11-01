"use client";

import { CircleCheck } from "lucide-react";

import {
  type RefundStatus,
  refundStatus,
  stepPatch,
  type TaxRefund,
  useSetRefundSteps,
} from "@/entities/tax-refund";
import { saveErrorText } from "@/shared/api/sync";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import { Button } from "@/shared/ui/button";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import { type DetailRow, detailRows, stepTimeLabel } from "../lib/refund-form";
import { memberName, useRefundMembers } from "../model/use-refund-members";
import { BarcodeCopyRow } from "./barcode-copy-row";
import { RefundPhotos } from "./refund-photos";

type RefundDetailSheetProps = {
  tripId: string;
  /** 보는 건 — null 이면 닫혀 있다(지워졌어도 닫는다) */
  refund: TaxRefund | null;
  onClose: () => void;
  /** 「수정」 — 폼을 연다 */
  onEdit: (refund: TaxRefund) => void;
  onToast: (text: string) => void;
};

/**
 * 택스 리펀 상세 — 모바일 바텀시트 · PC 가운데 480. 제목은 매장, 아래 단계 줄(세관 확인 · 받음 시각),
 * 다음 단계 버튼(「세관 확인했어요」 → 「환급 받았어요」)과 되돌리기, 바코드 번호(누르면 복사), 사진(영수증 · 물품 · 캡처), 정보 표(일행이 있으면 「누구 것」 부터), 「수정」
 */
export function RefundDetailSheet({
  tripId,
  refund,
  onClose,
  onEdit,
  onToast,
}: RefundDetailSheetProps) {
  const open = refund !== null;
  const shown = useHeldWhileClosing(open, refund);
  const steps = useSetRefundSteps(tripId);
  const { members } = useRefundMembers(tripId);
  /** 단계를 바꾼다 — 실패하면 토스트(화면은 되돌아간다) */
  const go = (r: TaxRefund, to: RefundStatus) =>
    steps.mutate(
      { id: r.id, steps: stepPatch(r, to, new Date().toISOString()) },
      { onError: (e) => onToast(saveErrorText(e, "바꾸지 못했어요. 잠시 뒤 다시 해 주세요")) },
    );
  return (
    <SheetDialog open={open} onClose={onClose} title={shown?.store} ariaTitle="환급 기록">
      {shown && (
        <div className="flex flex-col gap-4">
          <StepLine refund={shown} />
          <StepButtons refund={shown} pending={steps.isPending} onGo={(to) => go(shown, to)} />
          {shown.barcode && <BarcodeCopyRow value={shown.barcode} />}
          <RefundPhotos tripId={tripId} refund={shown} onToast={onToast} />
          <dl>
            {detailRows(shown, members ? memberName(members, shown.owner_id) : undefined).map(
              (row) => (
                <InfoRow key={row.label} row={row} />
              ),
            )}
          </dl>
          <Button
            variant="chip"
            size="form"
            className="w-24 self-end"
            onClick={() => onEdit(shown)}
          >
            수정
          </Button>
        </div>
      )}
    </SheetDialog>
  );
}

type StepLineProps = { refund: TaxRefund };

/** 단계 줄 — 「세관 확인 11.4 (수) 10:20 · 받음 11.4 (수) 10:41」, 아직이면 「세관 확인 전」 */
function StepLine({ refund }: StepLineProps) {
  const status = refundStatus(refund);
  if (status === "registered") {
    return (
      <p className="text-[13px] font-bold text-ink-450">세관 확인 전 — 짐 부치기 전에 받아요</p>
    );
  }
  const parts = [`세관 확인 ${stepTimeLabel(refund.customs_at!)}`];
  if (refund.received_at) parts.push(`받음 ${stepTimeLabel(refund.received_at)}`);
  return (
    <p className="flex items-center gap-1 text-[13px] font-bold text-brand-text">
      <CircleCheck className="size-3.5" aria-hidden="true" />
      {parts.join(" · ")}
    </p>
  );
}

type StepButtonsProps = { refund: TaxRefund; pending: boolean; onGo: (to: RefundStatus) => void };

/** 다음 단계 버튼과 되돌리기 — 신청함: 세관 확인했어요 / 세관 확인함: 환급 받았어요 + 되돌리기 / 받음: 되돌리기 */
function StepButtons({ refund, pending, onGo }: StepButtonsProps) {
  const status = refundStatus(refund);
  if (status === "received") {
    return (
      <Button variant="chip" size="form" disabled={pending} onClick={() => onGo("customs")}>
        받음 되돌리기
      </Button>
    );
  }
  return (
    <div className="flex gap-2">
      {status === "customs" && (
        <Button variant="chip" size="form" disabled={pending} onClick={() => onGo("registered")}>
          세관 확인 되돌리기
        </Button>
      )}
      <Button
        size="form"
        className="flex-1"
        disabled={pending}
        onClick={() => onGo(status === "registered" ? "customs" : "received")}
      >
        {status === "registered" ? "세관 확인했어요" : "환급 받았어요"}
      </Button>
    </div>
  );
}

type InfoRowProps = { row: DetailRow };

/** 정보 표 한 줄 — 라벨 84 · 14 회색, 값 14/600(링크면 파란 글자), 비면 「없음」 */
function InfoRow({ row }: InfoRowProps) {
  return (
    <div className="flex gap-3 border-t border-surface-muted py-3 text-sm">
      <dt className="w-21 shrink-0 text-ink-400">{row.label}</dt>
      <dd
        className={
          row.value
            ? "min-w-0 flex-1 font-semibold wrap-break-word whitespace-pre-line text-ink-900"
            : "flex-1 text-ink-350"
        }
      >
        {row.href ? (
          <a
            href={row.href}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            {row.value}
          </a>
        ) : (
          (row.value ?? "없음")
        )}
      </dd>
    </div>
  );
}
