"use client";

import { Loader2, MapPin, X } from "lucide-react";

import { useOnline } from "@/shared/lib/use-online";
import { SearchField } from "@/shared/ui/search-field";

import type { ExpenseFormState } from "../model/use-expense-form";

type PlaceFieldProps = { form: ExpenseFormState };

/**
 * 장소(선택, #289) — 일정에 없는 곳(편의점 · 약국)에서 쓴 돈의 장소. 일정을 연결하지 않았을 때만 보인다(연결하면 그 일정의 장소).
 * 고르기 전: 검색 칸 + 아래 구글 결과 5곳(칸을 밀어 내린다). 고른 뒤: 장소 이름 · 주소 상자 + ✕.
 * 오프라인이면 검색할 수 없어 칸을 흐리게 하고 안내한다
 */
export function PlaceField({ form }: PlaceFieldProps) {
  const place = form.place;
  const online = useOnline();
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold text-ink-700">
        장소 <span className="font-medium text-ink-350">(선택)</span>
      </span>
      {place.picked ? (
        <div className="flex h-13 items-center gap-2.5 rounded-memo border border-input px-3">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-bold text-ink-900">{place.picked.name}</span>
            {place.picked.address && (
              <span className="truncate text-xs text-ink-400">{place.picked.address}</span>
            )}
          </span>
          <button
            type="button"
            aria-label="장소 빼기"
            onClick={place.clear}
            className="-mr-1 flex size-8 shrink-0 items-center justify-center text-ink-400"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <>
          <SearchField
            value={place.query}
            onValueChange={place.setQuery}
            placeholder={online ? "편의점 · 약국처럼 일정에 없는 곳" : "연결되면 찾을 수 있어요"}
            disabled={!online || place.busy}
            aria-label="장소 찾기"
          />
          <Suggestions form={form} />
        </>
      )}
      {place.error && <span className="text-xs text-destructive">{place.error}</span>}
    </div>
  );
}

/** 검색 결과 5곳 — 고르는 동안은 돌아가는 아이콘 */
function Suggestions({ form }: PlaceFieldProps) {
  const place = form.place;
  const predictions = place.suggestions
    .map((s) => ({ s, p: s.placePrediction }))
    .filter((x): x is { s: typeof x.s; p: NonNullable<typeof x.p> } => x.p !== null)
    .slice(0, 5);
  if (place.busy)
    return (
      <span className="flex items-center gap-1.5 px-1 text-xs text-ink-400">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        장소를 붙이는 중…
      </span>
    );
  if (predictions.length === 0) return null;
  return (
    <ul className="flex flex-col divide-y divide-divider rounded-card border border-line bg-white">
      {predictions.map(({ s, p }) => (
        <li key={p.placeId}>
          <button
            type="button"
            onClick={() => place.pick(s)}
            className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left"
          >
            <span className="truncate text-sm font-bold text-ink-900">{p.mainText?.text}</span>
            <span className="truncate text-xs text-ink-400">{p.secondaryText?.text}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
