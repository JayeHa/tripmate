"use client";

import type { Stay, StaySaveResult } from "@/entities/stay";
import { useReportLock } from "@/shared/lib/use-dialog-state";

import { useStayDelete } from "../model/use-stay-delete";
import { type LocationPickRequest, useStayForm } from "../model/use-stay-form";
import { DeleteStayConfirm, PruneCardsConfirm } from "./stay-confirms";
import { StayDatesSheet } from "./stay-dates-sheet";
import { StayForm } from "./stay-form";
import { StaysHeader } from "./stays-header";

type LinkedItem = { stay_id: string | null; alternative_of: string | null; day_index: number };

type StayFormScreenProps = {
  tripId: string;
  trip: { start_date: string; end_date: string };
  stay: Stay | null;
  items: readonly LinkedItem[];
  onPickLocation: (req: LocationPickRequest) => void;
  onBack: () => void;
  onSaved: (result: StaySaveResult) => void;
  onDeleted: (removed: number) => void;
  onLockChange: (locked: boolean) => void;
};

/** 숙소 입력 화면 — 머리(← · 「숙소 추가 / 숙소 수정」 · 완료) + 칸들, 위를 덮는 숙박 날짜 달력, 확인창들 */
export function StayFormScreen({
  tripId,
  trip,
  stay,
  items,
  onPickLocation,
  onBack,
  onSaved,
  onDeleted,
  onLockChange,
}: StayFormScreenProps) {
  const form = useStayForm({ tripId, trip, stay, items, onPickLocation, onSaved });
  useReportLock(form.locked, onLockChange);
  return (
    <>
      <StaysHeader
        title={stay ? "숙소 수정" : "숙소 추가"}
        back={{ kind: "back", onClick: onBack }}
        action={{ label: "완료", onClick: form.submit, disabled: form.saving }}
        locked={form.locked}
      />
      {stay ? (
        <EditForm form={form} tripId={tripId} stay={stay} items={items} onDeleted={onDeleted} />
      ) : (
        <StayForm form={form} onDelete={null} />
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
  onDeleted: (removed: number) => void;
};

/** 고치기 — 맨 아래 「숙소 삭제」 와 그 확인창 */
function EditForm({ form, tripId, stay, items, onDeleted }: EditFormProps) {
  const del = useStayDelete({ tripId, stayId: stay.id, items, onDeleted });
  return (
    <>
      <StayForm form={form} onDelete={del.deleting ? null : del.request} />
      {del.error && <p className="px-5 pb-3 text-[13px] text-destructive">{del.error}</p>}
      <DeleteStayConfirm
        open={del.open}
        count={del.count}
        onCancel={del.cancel}
        onConfirm={del.confirm}
      />
    </>
  );
}
