import { Button } from "@/shared/ui/button";

import { dateCtaLabel, pcCityCtaLabel } from "../../lib/cta";
import type { TripCreateState } from "../../model/use-trip-create";
import { CreateError } from "../parts/create-error";
import { PcPickedChips } from "./pc-picked-chips";

/** PC 모달 바닥. 고른 도시 칩 + 단계별 CTA (시안 6b · 6c) */
export function PcFooter({ state }: { state: TripCreateState }) {
  const cityStep = state.step === "city";
  return (
    <>
      {state.create.error && (
        <div className="shrink-0 px-7 pb-2">
          <CreateError state={state} />
        </div>
      )}
      <div className="flex shrink-0 items-center gap-4 border-t border-divider px-7 pt-3.5 pb-[18px]">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          <PcPickedChips picked={state.picked} onRemove={cityStep ? state.toggle : undefined} />
        </div>
        {cityStep ? (
          <Button
            size="cta"
            className="w-[280px] shrink-0"
            disabled={state.picked.length === 0}
            onClick={state.goDate}
          >
            {pcCityCtaLabel(state.picked.length)}
          </Button>
        ) : (
          <Button
            size="cta"
            className="w-[280px] shrink-0"
            disabled={!state.selection?.end || state.create.isPending}
            onClick={state.submit}
          >
            {dateCtaLabel(state.selection, state.create.isPending)}
          </Button>
        )}
      </div>
    </>
  );
}
