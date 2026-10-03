"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { cityAreasLabel, groupByRegion, searchCities } from "../lib/search";
import type { City, CityCatalog, CityScope } from "../model/types";
import { CityThumb } from "./city-thumb";

type Layout = "mobile" | "pc";

type Props = {
  catalog: CityCatalog;
  /** 검색어. 입력란은 화면마다 자리가 달라 바깥에서 그린다. */
  query: string;
  selected: readonly string[];
  onToggle: (city: City) => void;
  layout: Layout;
};

const SCOPES: { key: CityScope; label: string }[] = [
  { key: "abroad", label: "해외도시" },
  { key: "domestic", label: "국내도시" },
];
const ALL = "전체";

/**
 * 도시 다중 선택 (시안 5b · 6b). 해외/국내 탭 + 권역 칩 + 도시 목록.
 * 검색어가 있으면 탭·권역과 상관없이 전체에서 찾는다.
 */
export function CityPicker({ catalog, query, selected, onToggle, layout }: Props) {
  const [scope, setScope] = useState<CityScope>("abroad");
  const [region, setRegion] = useState<string>(ALL);
  const pc = layout === "pc";

  const searching = query.trim().length > 0;
  const sections = searching
    ? [{ title: "검색 결과", cities: searchCities(catalog.cities, query) }]
    : groupByRegion(catalog.regions, catalog.cities, scope)
        .filter((g) => region === ALL || g.region?.id === region)
        .map((g) => ({ title: g.region?.name ?? "국내도시", cities: g.cities }));
  const visible = sections.filter((s) => s.cities.length > 0);
  // 국내는 권역 없이 바로 도시라 칩을 그리지 않는다
  const chips = scope === "abroad" ? [ALL, ...catalog.regions.map((r) => r.id)] : [];
  const chipLabel = (id: string) =>
    id === ALL ? ALL : catalog.regions.find((r) => r.id === id)?.name;

  const tabs = SCOPES.map((s) => (
    <button
      key={s.key}
      type="button"
      onClick={() => {
        setScope(s.key);
        setRegion(ALL);
      }}
      className={cn(
        "-mb-px border-b-2 font-bold",
        pc ? "pt-1 pb-2.5 text-[15px]" : "flex-1 pt-3.5 pb-3 text-center text-base",
        scope === s.key ? "border-ink-900 text-ink-900" : "border-transparent text-ink-350",
      )}
    >
      {s.label}
    </button>
  ));

  const chipRow = chips.map((id) => {
    const on = region === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setRegion(id)}
        className={cn(
          "flex shrink-0 items-center rounded-full",
          pc
            ? "h-[30px] px-3 text-[13px] font-bold"
            : "h-[34px] border px-3.5 text-sm font-semibold",
          on
            ? "border-ink-900 bg-ink-900 text-white"
            : pc
              ? "bg-surface-muted text-ink-600"
              : "border-line bg-white text-ink-700",
        )}
      >
        {chipLabel(id)}
      </button>
    );
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!searching &&
        (pc ? (
          <div className="flex shrink-0 items-center gap-5 border-b border-surface-muted px-7 pt-3.5">
            {tabs}
            <div className="ml-auto flex gap-1.5 pb-2">{chipRow}</div>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 border-b border-surface-muted">{tabs}</div>
            {chips.length > 0 && (
              <div className="flex shrink-0 gap-2 overflow-x-auto bg-surface-sunken px-5 py-3">
                {chipRow}
              </div>
            )}
          </>
        ))}

      <div className={cn("min-h-0 flex-1 overflow-y-auto pb-3", pc && "px-7")}>
        {visible.map((section) => (
          <section key={section.title}>
            <h3
              className={cn(
                "font-bold text-ink-700",
                pc ? "pt-[18px] pb-1.5 text-sm" : "px-5 pt-[22px] pb-1.5 text-[15px]",
              )}
            >
              {section.title}
            </h3>
            <div className={cn(pc && "grid grid-cols-2 gap-x-6")}>
              {section.cities.map((city) => (
                <CityRow
                  key={city.id}
                  city={city}
                  on={selected.includes(city.id)}
                  pc={pc}
                  onToggle={() => onToggle(city)}
                />
              ))}
            </div>
          </section>
        ))}
        {visible.length === 0 && (
          <p className="py-12 text-center text-sm text-ink-400">검색 결과가 없어요</p>
        )}
      </div>
    </div>
  );
}

function CityRow({
  city,
  on,
  pc,
  onToggle,
}: {
  city: City;
  on: boolean;
  pc: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={cn(
        "flex w-full items-center text-left",
        pc ? "gap-3 py-[9px]" : "gap-3.5 px-5 py-2.5",
      )}
    >
      <CityThumb city={city} size={pc ? 44 : 48} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("font-bold text-ink-900", pc ? "text-base" : "text-[17px]")}>
          {city.name}
        </span>
        <span className={cn("truncate text-ink-400", pc ? "text-xs" : "text-[13px]")}>
          {cityAreasLabel(city)}
        </span>
      </span>
      <span
        className={cn(
          "flex shrink-0 items-center rounded-full border font-bold",
          pc ? "h-[30px] px-3 text-[13px]" : "h-[34px] px-3.5 text-sm",
          on
            ? "border-primary bg-white text-primary"
            : "border-surface-muted bg-surface-muted text-ink-800",
        )}
      >
        {on ? "취소" : "선택"}
      </span>
    </button>
  );
}
