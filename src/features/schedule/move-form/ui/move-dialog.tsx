"use client";

import type { MoveMode } from "@/entities/schedule-item";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

import { useMoveActions } from "../model/use-move-actions";
import { MoveFields } from "./move-fields";

type LatLng = { lat: number; lng: number };

/** 창이 다루는 장소 쌍과 지금 적혀 있는 값 */
export type MovePair = {
  fromItemId: string;
  fromName: string;
  from: LatLng;
  toItemId: string;
  toName: string;
  to: LatLng;
  mode: MoveMode | null;
  detail: string | null;
  /** 직접 정한 소요 시간(분). null 이면 자동 */
  minutes: number | null;
  hasMove: boolean;
};

type MoveDialogProps = {
  tripId: string;
  open: boolean;
  /** 닫히는 동안에도 내용이 남아 있도록 닫은 뒤에도 마지막 쌍을 넘긴다 */
  pair: MovePair | null;
  onClose: () => void;
};

/**
 * 「이동 방법」 창. 모바일 · PC 모두 가운데 400px.
 * 수단 칩은 하나만, 다시 누르면 해제. 소요 시간(분)은 비우면 자동(「자동 N분」), 상세는 60자.
 * 모두 비우고 저장하거나 「자동으로」 를 누르면 기록을 지워 자동 계산으로 돌아간다.
 * 저장 · 지우기 요청이 서버에 가 있는 동안은 Esc · 바깥 클릭 · 취소로 닫히지 않는다(useMoveActions 의 locked).
 */
export function MoveDialog({ tripId, open, pair, onClose }: MoveDialogProps) {
  const actions = useMoveActions(tripId);
  const close = () => {
    actions.reset();
    onClose();
  };
  return (
    <Dialog open={open && !!pair} locked={actions.locked} onOpenChange={(next) => !next && close()}>
      <DialogContent className="grid-cols-[minmax(0,1fr)] gap-3.5 px-5 pt-5.5 pb-4.5 sm:max-w-100">
        {pair && (
          <MoveFields
            key={`${pair.fromItemId}>${pair.toItemId}`}
            pair={pair}
            actions={actions}
            onClose={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
