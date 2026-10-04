import { Search } from "lucide-react";

import type { TripCreateState } from "../../model/use-trip-create";
import { CitySearchInput } from "../parts/city-search-input";
import { CityStepBody } from "../parts/city-step-body";

type PcCityStepProps = { state: TripCreateState };

/** PC 도시 단계 본문. 회색 검색창 + 도시 목록 */
export function PcCityStep({ state }: PcCityStepProps) {
  return (
    <>
      <div className="shrink-0 px-7">
        <div className="flex h-11.5 items-center gap-2 rounded-card bg-surface-muted px-3.5">
          <Search className="size-5 shrink-0 text-ink-400" />
          <CitySearchInput value={state.query} onChange={state.setQuery} className="text-[15px]" />
        </div>
      </div>
      <CityStepBody state={state} layout="pc" />
    </>
  );
}
