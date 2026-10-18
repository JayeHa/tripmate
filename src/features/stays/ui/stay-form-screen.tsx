"use client";

import { usePaymentDraft } from "@/entities/expense";
import { useUser } from "@/entities/session";
import type { Stay, StaySaveResult } from "@/entities/stay";
import { useReportLock } from "@/shared/lib/use-dialog-state";
import { ScreenHeader } from "@/shared/ui/screen-header";

import type { StayRegistration } from "../lib/stay-form";
import type { StayPaymentRequest } from "../lib/stay-payment";
import { useStayDelete } from "../model/use-stay-delete";
import { type LocationPickRequest, useStayForm } from "../model/use-stay-form";
import { DeleteStayConfirm, PruneCardsConfirm } from "./stay-confirms";
import { StayDatesSheet } from "./stay-dates-sheet";
import { StayForm } from "./stay-form";
import { StayPaymentDraftSection, StayPaymentSection } from "./stay-payment";

type LinkedItem = {
  id: string;
  stay_id: string | null;
  alternative_of: string | null;
  day_index: number;
};

type StayFormScreenProps = {
  tripId: string;
  trip: { start_date: string; end_date: string };
  stay: Stay | null;
  /** 「숙소로 등록」 — 새 숙소 폼을 그 일정으로 채운다 */
  registration?: StayRegistration | null;
  items: readonly LinkedItem[];
  onPickLocation: (req: LocationPickRequest) => void;
  /** 결제 칸 — 비용 입력 창을 여는 쪽(화면)에 넘긴다. 새 숙소는 초안으로 열린다 */
  onPayment: (req: StayPaymentRequest) => void;
  onBack: () => void;
  /** paid — 새 숙소의 결제 초안을 만들지 못했으면 false(숙소는 저장됐다) */
  onSaved: (result: StaySaveResult, paid: boolean) => void;
  onDeleted: (removed: number) => void;
  onLockChange: (locked: boolean) => void;
};

/**
 * 숙소 입력 화면 — 머리(← · 「숙소 추가 / 숙소 수정」 · 완료) + 칸들, 위를 덮는 숙박 날짜 달력, 확인창들.
 * 새 숙소의 결제는 초안으로 들고 있다가 숙소를 저장한 뒤 만든다 — 그동안도 저장 중이라 닫히지 않는다
 */
export function StayFormScreen({
  tripId,
  trip,
  stay,
  registration = null,
  items,
  onPickLocation,
  onPayment,
  onBack,
  onSaved,
  onDeleted,
  onLockChange,
}: StayFormScreenProps) {
  const { data: user } = useUser();
  const payment = usePaymentDraft(tripId, "stay", user?.id);
  const form = useStayForm({
    tripId,
    trip,
    stay,
    registration,
    items,
    onPickLocation,
    savePayment: payment.save,
    onSaved,
  });
  useReportLock(form.locked || payment.locked, onLockChange);
  return (
    <>
      <ScreenHeader
        title={stay ? "숙소 수정" : "숙소 추가"}
        back={{ kind: "back", onClick: onBack }}
        action={{ label: "완료", onClick: form.submit, disabled: form.saving || payment.saving }}
        locked={form.locked || payment.locked}
      />
      {stay ? (
        <EditForm
          form={form}
          tripId={tripId}
          stay={stay}
          items={items}
          onPayment={onPayment}
          onDeleted={onDeleted}
        />
      ) : (
        <StayForm
          form={form}
          payment={
            <StayPaymentDraftSection
              tripId={tripId}
              name={form.values.name}
              payment={payment}
              disabled={form.saving || payment.saving}
              onPayment={onPayment}
            />
          }
          onDelete={null}
        />
      )}
      {form.datesOpen && (
        <StayDatesSheet
          trip={trip}
          checkIn={form.values.checkIn}
          checkOut={form.values.checkOut}
          onClose={form.closeDates}
          onDone={form.applyDates}
        />
      )}
      <PruneCardsConfirm count={form.pending} onResolve={form.resolvePending} />
    </>
  );
}

type EditFormProps = {
  form: ReturnType<typeof useStayForm>;
  tripId: string;
  stay: Stay;
  items: readonly LinkedItem[];
  onPayment: (req: StayPaymentRequest) => void;
  onDeleted: (removed: number) => void;
};

/** 고치기 — 「결제」 칸, 맨 아래 「숙소 삭제」 와 그 확인창 */
function EditForm({ form, tripId, stay, items, onPayment, onDeleted }: EditFormProps) {
  const del = useStayDelete({ tripId, stayId: stay.id, items, onDeleted });
  return (
    <>
      <StayForm
        form={form}
        payment={
          <StayPaymentSection
            tripId={tripId}
            stayId={stay.id}
            name={stay.place.name}
            onPayment={onPayment}
          />
        }
        onDelete={del.deleting ? null : del.request}
      />
      {del.error && <p className="px-5 pb-3 text-[13px] text-destructive">{del.error}</p>}
      <DeleteStayConfirm
        open={del.open}
        count={del.count}
        paid={del.paid}
        checklist={del.checklist}
        vouchers={del.vouchers}
        onCancel={del.cancel}
        onConfirm={del.confirm}
      />
    </>
  );
}
