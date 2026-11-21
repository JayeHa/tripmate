"use client";

import { useState } from "react";

import {
  autoMoveMinutes,
  directionsUrl,
  MOVE_DETAIL_MAX,
  MOVE_MINUTES_MAX,
  MOVE_MODE_LABEL,
  MOVE_MODES,
  type MoveMode,
  placeSegment,
  segmentTravelMode,
} from "@/entities/schedule-item";
import { Button } from "@/shared/ui/button";
import { DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { FilterChip } from "@/shared/ui/filter-chip";

import type { useMoveActions } from "../model/use-move-actions";
import type { MovePair } from "./move-dialog";

const INPUT =
  "h-11.5 w-full rounded-memo border border-line px-3 text-[15px] text-ink-900 outline-none focus:border-primary";

type MoveFieldsProps = {
  pair: MovePair;
  actions: ReturnType<typeof useMoveActions>;
  onClose: () => void;
};

/** 소요 시간 칸의 글자 → 분. 비었으면 null(자동), 1–1440 정수가 아니면 undefined(저장 못 함) */
function parseMinutes(text: string): number | null | undefined {
  if (!text.trim()) return null;
  const n = Number(text);
  return Number.isInteger(n) && n >= 1 && n <= MOVE_MINUTES_MAX ? n : undefined;
}

/** 「↗ 구글맵에서 경로 확인」 의 주소 — 고른 수단(없으면 추정)으로. 항공은 길찾기가 없어 null */
function gmapHref(pair: MovePair, mode: MoveMode | null): string | null {
  const travel = segmentTravelMode(placeSegment(pair.from, pair.to, null, { mode, detail: null }));
  return travel && directionsUrl(pair.from, pair.to, travel);
}

/** 창 내용. 쌍이 바뀌면 key 로 새로 만들어 입력값을 초기화한다 */
export function MoveFields({ pair, actions, onClose }: MoveFieldsProps) {
  const [mode, setMode] = useState<MoveMode | null>(pair.mode);
  const [minutesText, setMinutesText] = useState(pair.minutes === null ? "" : String(pair.minutes));
  const [detail, setDetail] = useState(pair.detail ?? "");
  const ids = { fromItemId: pair.fromItemId, toItemId: pair.toItemId };
  const minutes = parseMinutes(minutesText);
  const empty = !mode && minutes === null && !detail.trim();
  const auto = autoMoveMinutes(pair.from, pair.to, mode);
  const href = gmapHref(pair, mode);

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
          <FilterChip key={m} selected={mode === m} onClick={() => setMode(mode === m ? null : m)}>
            {MOVE_MODE_LABEL[m]}
          </FilterChip>
        ))}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-ink-700">소요 시간 (분)</span>
        <input
          value={minutesText}
          onChange={(e) => setMinutesText(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          maxLength={4}
          placeholder={auto === null ? "자동" : `자동 ${auto}분`}
          aria-invalid={minutes === undefined}
          className={INPUT}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-ink-700">
          상세 <span className="font-medium text-ink-350">(선택)</span>
        </span>
        <input
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={MOVE_DETAIL_MAX}
          placeholder="예: 유라쿠초선 직통 · 환승 없음"
          className={INPUT}
        />
      </label>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-[13px] font-bold text-primary"
        >
          ↗ 구글맵에서 경로 확인
        </a>
      )}
      {minutes === undefined && (
        <p className="text-[13px] text-destructive">소요 시간은 1분 ~ 1440분으로 적어 주세요</p>
      )}
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
            자동으로
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
          disabled={actions.pending || minutes === undefined || (empty && !pair.hasMove)}
          onClick={() =>
            minutes !== undefined && actions.submit(ids, { mode, minutes, detail }, onClose)
          }
        >
          저장
        </Button>
      </div>
    </>
  );
}
