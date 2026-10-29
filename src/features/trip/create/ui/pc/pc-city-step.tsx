import { CityCatalogPicker } from "@/entities/city";
import { SearchField } from "@/shared/ui/search-field";

import type { TripCreateState } from "../../model/use-trip-create";

type PcCityStepProps = { state: TripCreateState };

/** PC 도시 단계 본문. 회색 검색창 + 도시 목록 */
export function PcCityStep({ state }: PcCityStepProps) {
  return (
    <>
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
    </>
  );
}
