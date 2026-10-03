"use client";

import { CityPicker, useCityCatalog } from "@/entities/city";

import type { TripCreateState } from "../../model/use-trip-create";

type CityStepBodyProps = {
  state: TripCreateState;
  layout: "mobile" | "pc";
};

/** 도시 단계 본문. 카탈로그를 불러오는 동안·실패했을 때의 자리를 함께 맡는다. */
export function CityStepBody({ state, layout }: CityStepBodyProps) {
  const { data: catalog, error } = useCityCatalog();
  if (!catalog) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-ink-400">
        {error ? "도시 목록을 불러오지 못했어요" : "도시를 불러오는 중…"}
      </p>
    );
  }
  return (
    <CityPicker
      catalog={catalog}
      query={state.query}
      selected={state.picked.map((c) => c.id)}
      onToggle={state.toggle}
      layout={layout}
    />
  );
}
