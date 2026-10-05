"use client";

import { useState } from "react";

import type { ScheduleItem } from "@/entities/schedule-item";

import type { AlternativeActions } from "../model/use-alternative-actions";
import { useAlternativeChoices } from "../model/use-alternative-choices";

type AlternativePickerProps = {
  tripId: string;
  main: ScheduleItem;
  alternatives: ScheduleItem[];
  actions: AlternativeActions;
  onClose: () => void;
  /** 「+ 직접 추가」 — 장소 입력 폼을 대체 장소 모드로 연다 */
  onDirectAdd: () => void;
};

/**
 * 「저장한 장소에서 고르기」 — 이름 검색 + 목록(이름 · 카테고리 · 설명, 「선택」). 고르면 대체 장소로 붙이고 닫는다.
 * 맞는 장소가 없으면 「+ 직접 추가」 로 장소 입력 폼(위치 먼저)을 연다
 */
export function AlternativePicker({
  tripId,
  main,
  alternatives,
  actions,
  onClose,
  onDirectAdd,
}: AlternativePickerProps) {
  const [query, setQuery] = useState("");
  const { choices, loading } = useAlternativeChoices(tripId, main, alternatives, query);

  /** 골라 붙인다. 붙었을 때만 닫는다(실패 문구는 블록 아래에) */
  async function pick(placeId: string) {
    if (await actions.addSaved(placeId)) onClose();
  }

  return (
    <div className="flex flex-col gap-2 rounded-card border border-primary p-3">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-extrabold text-ink-900">저장한 장소에서 고르기</span>
        <button type="button" onClick={onClose} className="text-[13px] text-ink-400">
          닫기
        </button>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="장소 이름 검색"
        aria-label="장소 이름 검색"
        className="h-10 rounded-memo bg-surface-muted px-3 text-sm text-ink-900 outline-none"
      />
      <div className="flex max-h-65 flex-col overflow-y-auto">
        {choices.map(({ place, meta }) => (
          <div
            key={place.id}
            className="flex min-h-13 items-center gap-2.5 border-b border-surface-muted px-0.5 py-2"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-bold text-ink-900">{place.name}</span>
              {meta && <span className="truncate text-xs text-ink-400">{meta}</span>}
            </div>
            <button
              type="button"
              disabled={actions.pending}
              onClick={() => void pick(place.id)}
              className="h-7.5 shrink-0 rounded-full bg-surface-muted px-3 text-[13px] font-bold text-ink-700 disabled:opacity-40"
            >
              선택
            </button>
          </div>
        ))}
        {!loading && choices.length === 0 && (
          <span className="px-0.5 py-2.5 text-[13px] text-ink-350">맞는 장소가 없어요.</span>
        )}
      </div>
      <button
        type="button"
        onClick={onDirectAdd}
        className="self-center p-1 text-[13px] font-bold text-primary"
      >
        + 직접 추가
      </button>
    </div>
  );
}
