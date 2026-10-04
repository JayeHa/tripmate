"use client";

import { useMemo, useRef, useState } from "react";

import { type City, useTripCities } from "@/entities/city";
import {
  addPlaceErrorMessage,
  itemCoords,
  type ScheduleItem,
  useAddPlacesToSchedule,
  useSavedPlaces,
} from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { defaultCityId, usePlaceSuggestions } from "@/shared/lib/google-places";

import {
  type CategoryFilter,
  chooseNew,
  chooseSaved,
  type Chosen,
  filterSaved,
  scheduledKeys,
  toggleChosen,
} from "../lib/chosen";

export type AddScheduleTab = "rec" | "saved";

type AddScheduleOptions = {
  tripId: string;
  /** 처음 담을 날. 화면 안에서 바꿀 수 있다 */
  initialDay: number;
  /** 여행 전체 일정. 「일정에 있음」 과 그날의 기준 도시를 정한다 */
  items: ScheduleItem[];
  /** 담기에 성공하면 부른다(화면을 닫는다) */
  onDone: () => void;
  /** 「‘검색어’ 직접 추가」. 장소 입력 폼은 다른 기능이라 화면(view)이 연다 */
  onDirectAdd: (request: DirectAddRequest) => void;
};

/**
 * 장소 입력 폼을 열 때 넘기는 값: 이름(검색어) · 담을 날 · 검색 범위 도시 ·
 * 아직 담지 않은 고른 곳 수(있으면 화면이 직접 추가를 담은 뒤에도 이 창을 닫지 않는다 — 닫으면 고른 곳이 사라진다)
 */
export type DirectAddRequest = {
  name: string;
  dayIndex: number;
  city: City | null;
  pendingCount: number;
};

/**
 * 「일정 추가」 화면의 상태와 동작. 열릴 때마다 새로 마운트돼 처음 값에서 시작한다.
 * - 추천 장소: 큐레이션(#34) 전까지 구글 검색 결과로 대신한다. 검색어가 없으면 안내만
 * - 저장한 장소: 이 여행 도시의 내 장소. 카테고리 · 검색어로 거른다
 * - 고른 곳은 하단 트레이에 고른 순서대로 모이고, 담기는 한 번에(add_schedule_places)
 */
export function useAddSchedule({
  tripId,
  initialDay,
  items,
  onDone,
  onDirectAdd,
}: AddScheduleOptions) {
  const { data: user } = useUser();
  const { data: cities = [] } = useTripCities(tripId);
  const cityIds = useMemo(() => cities.map((c) => c.id), [cities]);
  const saved = useSavedPlaces(tripId, user?.id, cityIds);
  const add = useAddPlacesToSchedule(tripId);

  const [dayIndex, setDayIndex] = useState(initialDay);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<AddScheduleTab>("rec");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [chosenCityId, setCityId] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Chosen[]>([]);
  const [resolveError, setResolveError] = useState<string | null>(null);
  // 구글 결과의 상세를 받는 중인 구글 id. ref 는 같은 결과를 다시 눌러도 한 번만 받게(렌더 전에도),
  // state 는 그 줄의 로딩 표시 · CTA 비활성에 쓴다 — 받는 동안 담으면 방금 고른 곳이 빠진다
  const resolving = useRef(new Set<string>());
  const [resolvingIds, setResolvingIds] = useState<ReadonlySet<string>>(new Set());
  // 담기 요청을 보낸 순간부터 끝날 때까지 다시 못 보내게. isPending 은 다음 렌더에야 true 라 빠른 두 번 탭을 못 막는다
  const submittingRef = useRef(false);

  // 고르지 않았으면 그날 첫 장소에서 가까운 도시
  const dayAnchor =
    items
      .filter((it) => it.day_index === dayIndex)
      .map(itemCoords)
      .find((at) => at !== null) ?? null;
  const cityId = chosenCityId ?? defaultCityId(cities, dayAnchor);
  const city: City | null = cities.find((c) => c.id === cityId) ?? null;

  const suggestions = usePlaceSuggestions(query, city);
  const inTrip = useMemo(() => scheduledKeys(items), [items]);
  const savedList = filterSaved(saved.data ?? [], category, query);

  /** 저장한 장소를 고르거나 뺀다 */
  function toggleSaved(place: Parameters<typeof chooseSaved>[0]) {
    setChosen((list) => toggleChosen(list, chooseSaved(place)));
  }

  /** 구글 결과를 고르거나 뺀다. 고를 때 상세(좌표 · 주소)를 받는다 */
  async function toggleSuggestion(s: google.maps.places.AutocompleteSuggestion) {
    const googleId = s.placePrediction?.placeId;
    if (!googleId || resolving.current.has(googleId)) return;
    const key = `google:${googleId}`;
    if (chosen.some((c) => c.key === key)) {
      setChosen((list) => list.filter((c) => c.key !== key));
      return;
    }
    resolving.current.add(googleId);
    setResolvingIds(new Set(resolving.current));
    setResolveError(null);
    try {
      const picked = await suggestions.resolve(s);
      if (picked) {
        // 담기에 쓰는 칸만 넘긴다(종류는 장소 입력 폼의 카테고리용)
        const { name, google_place_id, lat, lng, address } = picked;
        setChosen((list) =>
          toggleChosen(list, chooseNew({ name, google_place_id, lat, lng, address })),
        );
      }
    } catch (e) {
      setResolveError(e instanceof Error ? e.message : "장소 정보를 가져오지 못했어요");
    } finally {
      resolving.current.delete(googleId);
      setResolvingIds(new Set(resolving.current));
    }
  }

  /** 검색어를 이름으로 장소 입력 폼을 연다(위치 · 시간 · 예약 상태를 직접 입력) */
  function directAdd() {
    const name = query.trim();
    if (name) onDirectAdd({ name, dayIndex, city, pendingCount: chosen.length });
  }

  /** 고른 곳을 그날 끝에 한 번에 담는다 */
  function submit() {
    if (chosen.length === 0 || submittingRef.current || resolving.current.size > 0) return;
    submittingRef.current = true;
    add.mutate(
      { dayIndex, entries: chosen.map((c) => c.entry) },
      {
        onSuccess: onDone,
        onSettled: () => {
          submittingRef.current = false;
        },
      },
    );
  }

  return {
    dayIndex,
    setDayIndex,
    query,
    setQuery,
    tab,
    setTab,
    category,
    setCategory,
    cities,
    cityId,
    setCityId,
    suggestions,
    savedList,
    savedCount: saved.data?.length ?? 0,
    savedLoading: saved.isPending,
    inTrip,
    chosen,
    isChosen: (key: string) => chosen.some((c) => c.key === key),
    /** 이 구글 결과의 상세를 받는 중인지 */
    isResolving: (googleId: string) => resolvingIds.has(googleId),
    /** 상세를 받는 중인 결과가 있는지. 그동안은 담지 않는다 */
    resolving: resolvingIds.size > 0,
    toggleSaved,
    toggleSuggestion,
    directAdd,
    removeChosen: (key: string) => setChosen((list) => list.filter((c) => c.key !== key)),
    submit,
    submitting: add.isPending,
    error: resolveError ?? (add.error ? addPlaceErrorMessage(add.error) : null),
  };
}

export type AddScheduleState = ReturnType<typeof useAddSchedule>;
