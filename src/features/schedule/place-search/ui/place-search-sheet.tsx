"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/shared/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";

export type PickedPlace = {
  name: string;
  place_id: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 검색 편향 중심 (예: 해당 날 첫 장소) */
  bias?: { lat: number; lng: number } | null;
  onPick: (place: PickedPlace) => void;
};

export function PlaceSearchSheet({ open, onOpenChange, bias, onPick }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>장소 추가</SheetTitle>
          <SheetDescription>장소명이나 주소를 검색하세요</SheetDescription>
        </SheetHeader>
        {/* 열릴 때마다 마운트되어 검색 상태·세션 토큰이 초기화됨 */}
        {open && (
          <SearchBody
            bias={bias}
            onPick={(p) => {
              onPick(p);
              onOpenChange(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

type Suggestion = google.maps.places.AutocompleteSuggestion;

function SearchBody({ bias, onPick }: Pick<Props, "bias" | "onPick">) {
  const places = useMapsLibrary("places");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 검색 여러 번 + 선택 1번 = 세션 1회 과금
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    const input = query.trim();
    if (!places || !input) return;
    sessionRef.current ??= new places.AutocompleteSessionToken();
    // 아래 함수 안에서도 null 이 아님을 유지하려고 지역 상수로 잡는다
    const lib = places;

    async function search() {
      setLoading(true);
      setError(null);
      try {
        const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: sessionRef.current ?? undefined,
          language: "ko",
          ...(bias ? { locationBias: { center: bias, radius: 30_000 } } : {}),
        });
        setSuggestions(suggestions);
      } catch (e) {
        setError(e instanceof Error ? e.message : "검색에 실패했어요");
      } finally {
        setLoading(false);
      }
    }
    // 입력이 멈추고 250ms 뒤에 찾는다
    const handle = setTimeout(() => void search(), 250);
    return () => clearTimeout(handle);
  }, [places, query, bias]);

  function handleChange(value: string) {
    setQuery(value);
    if (!value.trim()) setSuggestions([]);
  }

  async function pick(s: Suggestion) {
    const prediction = s.placePrediction;
    if (!prediction) return;
    setLoading(true);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["id", "displayName", "location", "formattedAddress"] });
      sessionRef.current = null;
      onPick({
        name: place.displayName ?? prediction.mainText?.text ?? query,
        place_id: place.id ?? null,
        lat: place.location?.lat() ?? null,
        lng: place.location?.lng() ?? null,
        address: place.formattedAddress ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "장소 정보를 가져오지 못했어요");
      setLoading(false);
    }
  }

  function pickCustom() {
    const name = query.trim();
    if (!name) return;
    onPick({ name, place_id: null, lat: null, lng: null, address: null });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="예: 센소지, 시부야 스카이"
          className="h-11 pl-9"
          enterKeyHint="search"
        />
        {loading && (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!places && <p className="text-sm text-muted-foreground">지도 라이브러리를 불러오는 중...</p>}
      <ul className="flex min-h-0 flex-1 flex-col divide-y overflow-y-auto">
        {suggestions.map((s, i) => {
          const p = s.placePrediction;
          if (!p) return null;
          return (
            <li key={p.placeId ?? i}>
              <button
                type="button"
                onClick={() => void pick(s)}
                className="flex w-full items-start gap-3 py-3 text-left active:bg-accent"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.mainText?.text}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {p.secondaryText?.text}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {query.trim() && (
          <li>
            <button
              type="button"
              onClick={pickCustom}
              className="w-full py-3 text-left text-sm text-muted-foreground active:bg-accent"
            >
              “{query.trim()}” 이름만으로 추가 (지도에 표시되지 않음)
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
