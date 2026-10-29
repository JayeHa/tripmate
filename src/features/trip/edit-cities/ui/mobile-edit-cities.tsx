"use client";

import { Search, X } from "lucide-react";

import { CityCatalogPicker, cityCtaLabel, CitySearchInput, PickedTray } from "@/entities/city";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";

import type { EditCitiesState } from "../model/use-edit-cities";
import type { TitleComponent } from "./title";

type MobileEditCitiesProps = {
  state: EditCitiesState;
  onClose: () => void;
  Title: TitleComponent;
};

/** 모바일 도시 편집 — 새 여행의 도시 단계와 같은 화면. 머리에 검색, 아래에 고른 도시와 저장 */
export function MobileEditCities({ state, onClose, Title }: MobileEditCitiesProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-surface-muted px-4.5">
        <IconButton label="닫기" onClick={onClose} disabled={state.locked} className="text-ink-900">
          <X className="size-6" strokeWidth={2} />
        </IconButton>
        <Title className="sr-only">여행 도시 추가 및 편집</Title>
        <CitySearchInput value={state.query} onChange={state.setQuery} className="text-[17px]" />
        <Search className="size-5.5 shrink-0 text-ink-700" />
      </div>
      <CityCatalogPicker
        query={state.query}
        selected={state.picked.map((c) => c.id)}
        onToggle={state.toggle}
        layout="mobile"
      />
      <div className="flex shrink-0 flex-col gap-3 border-t border-divider bg-white px-5 pt-3 pb-[calc(34px+env(safe-area-inset-bottom))]">
        <PickedTray picked={state.picked} onRemove={state.toggle} />
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button
          size="cta"
          className="w-full"
          disabled={state.picked.length === 0 || state.unchanged || state.busy}
          onClick={state.submit}
        >
          {state.busy ? "저장하는 중…" : cityCtaLabel(state.picked.map((c) => c.name))}
        </Button>
      </div>
    </div>
  );
}
