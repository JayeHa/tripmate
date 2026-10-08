"use client";

import type { Trip } from "@/entities/trip";
import { DialogTitle } from "@/shared/ui/dialog";
import { FlowDialog } from "@/shared/ui/flow-dialog";

import { useEditDates } from "../model/use-edit-dates";
import { MobileEditDates } from "./mobile-edit-dates";
import { MoveItemsConfirm } from "./move-items-confirm";
import { PcEditDates } from "./pc-edit-dates";

type EditDatesDialogProps = {
  /** 고칠 여행. null 이면 닫힌다 */
  trip: Trip | null;
  /** 닫기 · 저장 완료 모두 */
  onClose: () => void;
};

/** 여행 기간 수정 다이얼로그. 모바일은 전체 화면, PC 는 가운데 모달 */
export function EditDatesDialog({ trip, onClose }: EditDatesDialogProps) {
  if (!trip) return null;
  // 여행마다 처음부터(기존 기간을 미리 고른 상태로) 시작한다
  return <EditDatesFlow key={trip.id} trip={trip} onClose={onClose} />;
}

type EditDatesFlowProps = { trip: Trip; onClose: () => void };

function EditDatesFlow({ trip, onClose }: EditDatesFlowProps) {
  const state = useEditDates(trip, onClose);
  return (
    <>
      <FlowDialog
        open
        // 저장 중에는 Esc · 바깥 클릭으로 닫히지 않는다
        locked={state.locked}
        onOpenChange={(open) => !open && onClose()}
        mobile={<MobileEditDates state={state} onClose={onClose} Title={DialogTitle} />}
        pc={<PcEditDates state={state} onClose={onClose} Title={DialogTitle} />}
      />
      <MoveItemsConfirm
        move={state.pendingMove}
        onCancel={state.cancelMove}
        onConfirm={state.confirmMove}
      />
    </>
  );
}
