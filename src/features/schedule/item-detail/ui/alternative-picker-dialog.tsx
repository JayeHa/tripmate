import type { ScheduleItem } from "@/entities/schedule-item";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import type { AlternativeActions } from "../model/use-alternative-actions";
import { AlternativePicker } from "./alternative-picker";

type AlternativePickerDialogProps = {
  open: boolean;
  onClose: () => void;
  tripId: string;
  main: ScheduleItem;
  alternatives: ScheduleItem[];
  actions: AlternativeActions;
  /** 「+ 직접 추가」 — 이 창을 닫고 부른 쪽이 장소 입력 폼을 대체 장소 모드로 연다 */
  onDirectAdd: () => void;
};

/** 「대체 장소 추가」 창 — 상세 위에 겹쳐 저장한 장소에서 고르거나 직접 추가한다. 칸의 「+」 · 「추가」 줄 칩이 함께 쓴다 */
export function AlternativePickerDialog({
  open,
  onClose,
  tripId,
  main,
  alternatives,
  actions,
  onDirectAdd,
}: AlternativePickerDialogProps) {
  return (
    <SheetDialog open={open} onClose={onClose} title="대체 장소 추가" locked={actions.locked}>
      <AlternativePicker
        tripId={tripId}
        main={main}
        alternatives={alternatives}
        actions={actions}
        onClose={onClose}
        onDirectAdd={() => {
          onClose();
          onDirectAdd();
        }}
      />
    </SheetDialog>
  );
}
