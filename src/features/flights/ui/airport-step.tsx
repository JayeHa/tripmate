"use client";

import { useState } from "react";

import { airportFromCode, airportOf, searchAirports } from "@/entities/flight";

import { UNDERLINE_INPUT } from "./underline-input";

type AirportStepProps = {
  /** 「출발 공항」 · 「도착 공항」 */
  label: string;
  onPick: (code: string) => void;
};

/**
 * 공항 찾기 — 코드 · 이름 · 도시로 찾아 고른다. 목록에 없으면 검색어가 3자리 영문일 때 그 코드로 넣는다
 * (시간대를 몰라 소요 시간은 보이지 않는다)
 */
export function AirportStep({ label, onPick }: AirportStepProps) {
  const [query, setQuery] = useState("");
  const results = searchAirports(query);
  const typed = airportFromCode(query);
  const offerCode = typed && !airportOf(typed);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-6 pt-1 pb-6">
      <div className="flex flex-col gap-2 pt-3.5">
        <span className="text-[13px] text-ink-400">{label}</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="공항명, 도시 또는 코드 예) NRT"
          aria-label={`${label} 검색`}
          // 단계를 열면 바로 찾는다
          autoFocus
          className={UNDERLINE_INPUT}
        />
      </div>
      {results.map((a) => (
        <button
          key={a.code}
          type="button"
          onClick={() => onPick(a.code)}
          className="flex items-center gap-3.5 border-b border-surface-muted py-3.5 text-left"
        >
          <span className="w-11 shrink-0 text-base font-extrabold text-brand-text">{a.code}</span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-bold text-ink-900">{a.name}</span>
            <span className="text-[13px] text-ink-400">{a.city}</span>
          </span>
        </button>
      ))}
      {results.length === 0 && !offerCode && (
        <span className="pt-3 text-sm text-ink-400">검색 결과가 없어요.</span>
      )}
      {offerCode && (
        <button
          type="button"
          onClick={() => onPick(typed)}
          className="flex items-center gap-3.5 border-b border-surface-muted py-3.5 text-left"
        >
          <span className="w-11 shrink-0 text-base font-extrabold text-brand-text">{typed}</span>
          <span className="text-sm font-bold text-ink-700">목록에 없는 공항 — 이 코드로 넣기</span>
        </button>
      )}
    </div>
  );
}
