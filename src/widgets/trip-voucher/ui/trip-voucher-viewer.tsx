"use client";

import type { Voucher } from "@/entities/voucher";
import { VoucherViewer } from "@/features/voucher";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";

import { useVoucherDetail } from "../model/use-voucher-detail";

type TripVoucherViewerProps = {
  tripId: string;
  /** 볼 바우처 id, 닫혀 있으면 null */
  voucherId: string | null;
  onClose: () => void;
  /** ⋯ 「수정」 — 부른 쪽이 수정 창을 뷰어 위에 연다 */
  onEdit: (voucher: Voucher) => void;
  /** 지운 뒤 — 뷰어를 연 쪽(상세 등)도 닫을 때 */
  onDeleted: () => void;
  onToast: (text: string) => void;
};

/**
 * 여행의 바우처 뷰어 — 주인 · 연결 · 날짜 · 번호 글을 만들어 뷰어에 넘긴다(노트 상세와 같은 글). 그사이 지워지면 닫힌다.
 * 닫히는 동안에는 마지막 바우처를 그린다
 */
export function TripVoucherViewer({
  tripId,
  voucherId,
  onClose,
  onEdit,
  onDeleted,
  onToast,
}: TripVoucherViewerProps) {
  // id 를 잡는다 — 상세 객체는 렌더마다 새로 만들어진다
  const heldId = useHeldWhileClosing(voucherId !== null, voucherId);
  const detail = useVoucherDetail(tripId, heldId);
  return (
    <VoucherViewer
      tripId={tripId}
      open={voucherId !== null && detail !== null}
      content={detail}
      onClose={onClose}
      onEdit={onEdit}
      onDeleted={onDeleted}
      onToast={onToast}
    />
  );
}
