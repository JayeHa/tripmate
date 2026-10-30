"use client";

import { X } from "lucide-react";

import { CityCatalogPicker, cityCtaLabel, PcPickedChips } from "@/entities/city";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { SearchField } from "@/shared/ui/search-field";

import type { EditCitiesState } from "../model/use-edit-cities";
import type { TitleComponent } from "./title";

type PcEditCitiesProps = {
  state: EditCitiesState;
  onClose: () => void;
  Title: TitleComponent;
};

/** PC 도시 편집 — 760×660 모달 안, 새 여행의 도시 단계와 같은 목록 */
export function PcEditCities({ state, onClose, Title }: PcEditCitiesProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex shrink-0 items-center gap-3 px-7 pt-5.5 pb-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <Title className="text-[22px] font-extrabold tracking-[-0.02em] text-ink-900">
            여행 도시 추가 및 편집
          </Title>
          <p className="text-sm text-ink-400">
            고른 순서대로 저장돼요. 첫 도시가 홈 위젯의 기준이에요.
          </p>
        </div>
        <IconButton label="닫기" onClick={onClose} disabled={state.locked} className="text-ink-400">
          <X className="size-6" strokeWidth={2} />
        </IconButton>
      </div>
      <div className="shrink-0 px-7">
        <SearchField
          value={state.query}
          onValueChange={state.setQuery}
          placeholder="여행, 어디로 떠나시나요?"
          aria-label="도시 검색"
        />
      </div>
      <CityCatalogPicker
        query={state.query}
        selected={state.picked.map((c) => c.id)}
        onToggle={state.toggle}
        layout="pc"
      />
      {state.error && <p className="shrink-0 px-7 pb-2 text-sm text-destructive">{state.error}</p>}
      <div className="flex shrink-0 items-center gap-4 border-t border-divider px-7 pt-3.5 pb-4.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          <PcPickedChips picked={state.picked} onRemove={state.toggle} />
        </div>
        <Button
          size="cta"
          className="w-70 shrink-0"
          disabled={state.picked.length === 0 || state.unchanged || state.busy}
          onClick={state.submit}
        >
          {state.busy ? "저장하는 중…" : cityCtaLabel(state.picked.map((c) => c.name))}
        </Button>
      </div>
    </div>
  );
}
