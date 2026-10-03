"use client";

import { useState } from "react";
import type { City } from "@/entities/city";
import { titleFromCities, useCreateTrip } from "@/entities/trip";
import { type DateSelection, pickDate } from "@/shared/lib/calendar";

/**
 * 만들기 플로우의 상태. 화면(뷰)이 하나 들고 모바일·PC 레이아웃이 함께 쓴다.
 * /trips/new 는 두 레이아웃을 CSS 로 나눠 함께 그리므로, 상태를 각자 가지면
 * 1024px 경계를 넘을 때(태블릿 회전) 고른 도시·날짜가 사라진 것처럼 보인다.
 */
export function useTripCreate(onCreated: (tripId: string) => void) {
  const create = useCreateTrip();
  const [step, setStep] = useState<"city" | "date">("city");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<City[]>([]);
  const [selection, setSelection] = useState<DateSelection>(null);

  const toggle = (city: City) =>
    setPicked((prev) =>
      prev.some((c) => c.id === city.id) ? prev.filter((c) => c.id !== city.id) : [...prev, city],
    );
  const goDate = () => {
    if (picked.length === 0) return;
    setSelection(null);
    setStep("date");
  };
  const backToCity = () => setStep("city");
  const pick = (date: string) => setSelection((prev) => pickDate(prev, date));
  const submit = () => {
    if (!selection?.end || create.isPending) return;
    create.mutate(
      {
        title: titleFromCities(picked.map((c) => c.name)),
        startDate: selection.start,
        endDate: selection.end,
        cityIds: picked.map((c) => c.id),
      },
      { onSuccess: onCreated },
    );
  };
  /** 처음부터 다시. 모달을 새로 열 때 쓴다. */
  const reset = () => {
    setStep("city");
    setQuery("");
    setPicked([]);
    setSelection(null);
    create.reset();
  };

  // 요청이 서버에 가 있는 동안은 닫거나 뒤로 가지 못하게 한다. 닫히면 완료 처리(강조)를 놓치고,
  // 모르고 다시 만들면 같은 여행이 둘 생긴다. 오프라인으로 멈춘 동안은 갇히지 않게 연다(#31).
  const locked = create.isPending && !create.isPaused;

  return {
    locked,
    step,
    query,
    setQuery,
    picked,
    toggle,
    goDate,
    backToCity,
    selection,
    pick,
    submit,
    reset,
    create,
  };
}

export type TripCreateState = ReturnType<typeof useTripCreate>;
