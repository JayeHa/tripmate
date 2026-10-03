"use client";

import { ArrowLeft, Search } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";

import { cityCtaLabel } from "../../lib/cta";
import type { TripCreateState } from "../../model/use-trip-create";
import { CitySearchInput } from "../parts/city-search-input";
import { CityStepBody } from "../parts/city-step-body";
import type { TitleComponent } from "../parts/title";
import { MobileFooter } from "./mobile-footer";
import { PickedTray } from "./picked-tray";

/** 모바일 도시 단계 (시안 5b). 헤더에 검색, 아래에 트레이와 CTA */
export function MobileCityStep({
  state,
  onClose,
  Title,
}: {
  state: TripCreateState;
  onClose: () => void;
  Title: TitleComponent;
}) {
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
      <CityStepBody state={state} layout="mobile" />
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
