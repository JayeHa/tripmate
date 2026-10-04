"use client";

import { useState } from "react";

import {
  MOVE_DETAIL_MAX,
  MOVE_MODE_LABEL,
  MOVE_MODES,
  type MoveMode,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";

import { useMoveActions } from "../model/use-move-actions";

/** 창이 다루는 장소 쌍과 지금 적혀 있는 값 */
export type MovePair = {
  fromItemId: string;
  fromName: string;
  toItemId: string;
  toName: string;
  mode: MoveMode | null;
  detail: string | null;
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
 * 수단 칩은 하나만, 다시 누르면 해제. 상세는 60자. 둘 다 비우고 저장하면 지운다.
 * 저장 · 지우기 요청이 서버에 가 있는 동안은 Esc · 바깥 클릭 · 취소로 닫히지 않는다(useMoveActions 의 locked).
 */
export function MoveDialog({ tripId, open, pair, onClose }: MoveDialogProps) {
  const actions = useMoveActions(tripId);
  const close = () => {
    actions.reset();
    onClose();
  };
  return (
    <Dialog open={open && !!pair} onOpenChange={(next) => !next && !actions.locked && close()}>
      <DialogContent className="grid-cols-[minmax(0,1fr)] gap-3.5 rounded-2xl px-5 pt-5.5 pb-4.5 sm:max-w-100">
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

type MoveFieldsProps = {
  pair: MovePair;
  actions: ReturnType<typeof useMoveActions>;
  onClose: () => void;
};

/** 창 내용. 쌍이 바뀌면 key 로 새로 만들어 입력값을 초기화한다 */
function MoveFields({ pair, actions, onClose }: MoveFieldsProps) {
  const [mode, setMode] = useState<MoveMode | null>(pair.mode);
  const [detail, setDetail] = useState(pair.detail ?? "");
  const ids = { fromItemId: pair.fromItemId, toItemId: pair.toItemId };
  const empty = !mode && !detail.trim();

  return (
    <>
      <div className="flex flex-col gap-1">
        <DialogTitle className="text-lg font-extrabold text-ink-900">이동 방법</DialogTitle>
        <DialogDescription className="truncate text-[13px] text-ink-400">
          {pair.fromName} → {pair.toName}
        </DialogDescription>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="이동 수단">
        {MOVE_MODES.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(mode === m ? null : m)}
            className={cn(
              "flex h-8.5 items-center rounded-full px-3 text-[13px] font-bold",
              mode === m ? "bg-ink-900 text-white" : "bg-surface-muted text-ink-700",
            )}
          >
            {MOVE_MODE_LABEL[m]}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-ink-700">
          상세 <span className="font-medium text-ink-350">(선택)</span>
        </span>
        <input
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={MOVE_DETAIL_MAX}
          placeholder="예: 유라쿠초선 직통 · 환승 없음"
          className="h-11.5 w-full rounded-memo border border-line px-3 text-[15px] text-ink-900 outline-none focus:border-primary"
        />
      </label>
      {actions.paused && (
        <p className="text-[13px] text-ink-500">오프라인이에요. 연결되면 저장돼요.</p>
      )}
      {actions.error && <p className="text-[13px] text-destructive">{actions.error}</p>}
      <div className="flex gap-2">
        {pair.hasMove && (
          <Button
            variant="destructive"
            size="form"
            className="text-sm font-bold"
            disabled={actions.pending}
            onClick={() => actions.erase(ids, onClose)}
          >
            지우기
          </Button>
        )}
        <div className="flex-1" />
        <Button
          variant="chip"
          size="form"
          className="text-sm font-bold"
          disabled={actions.locked}
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          size="form"
          className="px-5 text-sm font-bold"
          disabled={actions.pending || (empty && !pair.hasMove)}
          onClick={() => actions.submit(ids, mode, detail, onClose)}
        >
          저장
        </Button>
      </div>
    </>
  );
}
