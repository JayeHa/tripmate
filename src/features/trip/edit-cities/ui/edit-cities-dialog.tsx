"use client";

import { type City, useTripCities } from "@/entities/city";
import { DialogTitle } from "@/shared/ui/dialog";
import { FlowDialog } from "@/shared/ui/flow-dialog";

import { useEditCities } from "../model/use-edit-cities";
import { KeepItemsConfirm } from "./keep-items-confirm";
import { MobileEditCities } from "./mobile-edit-cities";
import { PcEditCities } from "./pc-edit-cities";

type EditCitiesDialogProps = {
  tripId: string;
  open: boolean;
  /** 닫기 · 저장 완료 모두 */
  onClose: () => void;
};

/** 여행 도시 추가 · 편집 다이얼로그. 모바일은 전체 화면, PC 는 가운데 모달. 지금 도시를 받은 뒤 연다 */
export function EditCitiesDialog({ tripId, open, onClose }: EditCitiesDialogProps) {
  const { data: cities } = useTripCities(tripId);
  if (!open || !cities) return null;
  // 닫으면 내려가서, 열 때마다 지금 도시를 고른 상태로 처음부터 시작한다
  return <EditCitiesFlow tripId={tripId} cities={cities} onClose={onClose} />;
}

type EditCitiesFlowProps = { tripId: string; cities: City[]; onClose: () => void };

/** 열린 동안의 창 — 상태를 하나 들고 두 레이아웃에 넘긴다 */
function EditCitiesFlow({ tripId, cities, onClose }: EditCitiesFlowProps) {
  const state = useEditCities(tripId, cities, onClose);
  return (
    <>
      <FlowDialog
        open
        // 저장 중에는 Esc · 바깥 클릭으로 닫히지 않는다
        locked={state.locked}
        onOpenChange={(open) => !open && onClose()}
        mobile={<MobileEditCities state={state} onClose={onClose} Title={DialogTitle} />}
        pc={<PcEditCities state={state} onClose={onClose} Title={DialogTitle} />}
      />
      <KeepItemsConfirm
        kept={state.pendingKeep}
        onCancel={state.cancelKeep}
        onConfirm={state.confirmKeep}
      />
    </>
  );
}
