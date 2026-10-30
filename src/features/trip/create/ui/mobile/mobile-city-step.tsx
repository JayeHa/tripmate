"use client";

import { ArrowLeft, Search } from "lucide-react";

import { CityCatalogPicker, cityCtaLabel, CitySearchInput, PickedTray } from "@/entities/city";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";

import type { TripCreateState } from "../../model/use-trip-create";
import type { TitleComponent } from "../parts/title";
import { MobileFooter } from "./mobile-footer";

type MobileCityStepProps = {
  state: TripCreateState;
  onClose: () => void;
  Title: TitleComponent;
};

/** 모바일 도시 단계. 헤더에 검색, 아래에 트레이와 CTA */
export function MobileCityStep({ state, onClose, Title }: MobileCityStepProps) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-surface-muted px-4.5">
        <IconButton label="닫기" onClick={onClose} disabled={state.locked} className="text-ink-900">
          <ArrowLeft className="size-6" strokeWidth={2} />
        </IconButton>
        <Title className="sr-only">어디로 떠나시나요?</Title>
        <CitySearchInput value={state.query} onChange={state.setQuery} className="text-[17px]" />
        <Search className="size-5.5 shrink-0 text-ink-700" />
      </div>
      <CityCatalogPicker
        query={state.query}
        selected={state.picked.map((c) => c.id)}
        onToggle={state.toggle}
        layout="mobile"
      />
      <MobileFooter>
        <PickedTray picked={state.picked} onRemove={state.toggle} />
        <Button
          size="cta"
          className="w-full"
          disabled={state.picked.length === 0}
          onClick={state.goDate}
        >
          {cityCtaLabel(state.picked.map((c) => c.name))}
        </Button>
      </MobileFooter>
    </>
  );
}
