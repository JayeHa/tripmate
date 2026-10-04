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
  /** 고른 장소를 담는다. 시트는 담기에 성공하면 부른 쪽이 닫는다 — 실패하면 열어 둔 채 error 를 보인다 */
  onPick: (place: PickedPlace) => void;
  /** 담는 중이면 다시 고르지 못하게 막는다 */
  pending?: boolean;
  /** 담기 실패 문구 */
  error?: string | null;
};

/** 장소 검색 시트. 검색어로 구글 장소를 찾거나 이름만으로 고른다 */
export function PlaceSearchSheet({ open, onOpenChange, bias, onPick, pending, error }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>일정 추가</SheetTitle>
          <SheetDescription>장소명이나 주소를 검색하세요</SheetDescription>
        </SheetHeader>
        {/* 열릴 때마다 마운트되어 검색 상태·세션 토큰이 초기화됨 */}
        {open && <SearchBody bias={bias} onPick={onPick} pending={pending} addError={error} />}
      </SheetContent>
    </Sheet>
  );
}

type Suggestion = google.maps.places.AutocompleteSuggestion;

type SearchBodyProps = Pick<Props, "bias" | "onPick" | "pending"> & { addError?: string | null };

/** 검색 입력과 결과 목록. 열릴 때마다 새로 마운트돼 검색어 · 세션 토큰이 초기화된다 */
function SearchBody({ bias, onPick, pending, addError }: SearchBodyProps) {
  const places = useMapsLibrary("places");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 검색 여러 번 + 선택 1번 = 세션 1회 과금
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  // 장소 정보를 받는 동안(담기 요청 전) 두 번 눌러 같은 일정이 둘 생기지 않게. 렌더를 기다리지 않고 바로 막는다
  const pickingRef = useRef(false);

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
    if (!prediction || pending || pickingRef.current) return;
    pickingRef.current = true;
    setLoading(true);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["id", "displayName", "location", "formattedAddress"] });
      sessionRef.current = null;
      setLoading(false);
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
    } finally {
      pickingRef.current = false;
    }
  }

  function pickCustom() {
    const name = query.trim();
    if (!name || pending) return;
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
          maxLength={100}
          className="h-11 pl-9"
          enterKeyHint="search"
        />
        {(loading || pending) && (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {(error ?? addError) && <p className="text-sm text-destructive">{error ?? addError}</p>}
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
