"use client";

import { cardVoucherTarget } from "@/entities/voucher";
import type { DetailVoucherSlot } from "@/features/schedule/item-detail";
import { LinkedVouchers, VoucherAddChip } from "@/features/voucher";
import { TripVoucherForm, TripVoucherViewer } from "@/widgets/trip-voucher";

import type { ScheduleVouchers } from "../model/use-schedule-vouchers";

/** 일정 상세의 바우처 칸 · 「추가」 줄 칩 — 줄을 누르면 그 바우처 뷰어, 「+」 · 칩은 바로 만든다(숙소 카드는 숙소에 연결) */
export function voucherSlot(
  tripId: string,
  sv: ScheduleVouchers,
  onToast: (text: string) => void,
): DetailVoucherSlot {
  return {
    renderBlock: (item) => (
      <LinkedVouchers
        tripId={tripId}
        vouchers={sv.ofCard(item)}
        target={cardVoucherTarget(item)}
        onOpen={sv.openViewer}
        onToast={onToast}
      />
    ),
    renderChip: (item) => (
      <VoucherAddChip tripId={tripId} target={cardVoucherTarget(item)} onToast={onToast} />
    ),
  };
}

/** 항공편 · 숙소 상세의 빈 바우처 칸 안내 */
const EMPTY_TEXT = "티켓 · 예약 확인서를 올려 두면 현장에서 바로 꺼내 볼 수 있어요.";

type DetailVouchersProps = {
  tripId: string;
  sv: ScheduleVouchers;
  onToast: (text: string) => void;
};

type FlightVouchersProps = DetailVouchersProps & { flightId: string; cardId: string | null };

/** 항공편 상세의 바우처 칸 — 이 항공편과 그 일정 카드의 바우처. 「+」 로 만들면 항공편에 연결 */
export function FlightVouchers({ tripId, sv, onToast, flightId, cardId }: FlightVouchersProps) {
  return (
    <LinkedVouchers
      tripId={tripId}
      vouchers={sv.ofCard({ id: cardId ?? "", stay_id: null, flight_id: flightId })}
      target={{ kind: "flight", id: flightId }}
      onOpen={sv.openViewer}
      onToast={onToast}
      emptyText={EMPTY_TEXT}
    />
  );
}

type StayVouchersProps = DetailVouchersProps & { stayId: string };

/** 숙소 상세의 바우처 칸 — 이 숙소의 바우처. 「+」 로 만들면 숙소에 연결 */
export function StayVouchers({ tripId, sv, onToast, stayId }: StayVouchersProps) {
  return (
    <LinkedVouchers
      tripId={tripId}
      vouchers={sv.ofStay(stayId)}
      target={{ kind: "stay", id: stayId }}
      onOpen={sv.openViewer}
      onToast={onToast}
      emptyText={EMPTY_TEXT}
    />
  );
}

type ScheduleVoucherOverlaysProps = {
  tripId: string;
  vouchers: ScheduleVouchers;
  onToast: (text: string) => void;
};

/** 일정 화면에서 여는 바우처 뷰어와 그 위의 수정 창 — 상세 · 카드 위에 뜬다 */
export function ScheduleVoucherOverlays({
  tripId,
  vouchers: sv,
  onToast,
}: ScheduleVoucherOverlaysProps) {
  return (
    <>
      <TripVoucherViewer
        tripId={tripId}
        voucherId={sv.viewerId}
        onClose={sv.closeViewer}
        onEdit={sv.openEdit}
        onDeleted={sv.closeViewer}
        onToast={onToast}
      />
      <TripVoucherForm
        tripId={tripId}
        open={sv.formOpen}
        voucher={sv.editing}
        onClose={sv.closeEdit}
        onToast={onToast}
      />
    </>
  );
}
