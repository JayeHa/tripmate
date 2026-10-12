"use client";

import { useRef, useState } from "react";

import {
  type Flight,
  type FlightFieldsInput,
  type FlightSaveResult,
  useSaveFlight,
} from "@/entities/flight";

import {
  blankFlightForm,
  flightFormFrom,
  type FlightFormValues,
  isFlightFormComplete,
  outsideTrip,
  toFlightFields,
} from "../lib/flight-form";
import { useAirlineDraft } from "./use-airline-draft";

/** 폼 안의 화면 — 입력 칸들 · 「항공편명 등록」(항공사 · 편명) · 출발/도착 공항 찾기 */
export type FlightFormScreen =
  { kind: "form" } | { kind: "airline" } | { kind: "airport"; which: "dep" | "arr" };

type FlightFormOptions = {
  tripId: string;
  trip: { start_date: string; end_date: string };
  /** 고치는 항공편. 새로 만들면 null */
  flight: Flight | null;
  /** 고치는 항공편에 일정 카드가 있다 — 탑승일을 기간 밖으로 옮기면 카드가 지워지니 먼저 묻는다 */
  hasCard: boolean;
  /** 저장이 끝났다(폼은 부른 쪽이 닫는다) */
  onSaved: (result: FlightSaveResult) => void;
};

/**
 * 항공편 입력 폼의 상태 — 값 · 폼 안 화면(항공사 · 공항 찾기) · 저장.
 * 새 항공편은 「항공편명 등록」 부터 연다. 고칠 때 탑승일이 여행 기간 밖으로 나가 일정 카드가 지워지면 저장 전에 묻는다(confirming)
 */
export function useFlightForm({ tripId, trip, flight, hasCard, onSaved }: FlightFormOptions) {
  const [values, setValues] = useState<FlightFormValues>(() =>
    flight ? flightFormFrom(flight) : blankFlightForm(trip.start_date),
  );
  const [screen, setScreen] = useState<FlightFormScreen>(() =>
    flight ? { kind: "form" } : { kind: "airline" },
  );
  const airline = useAirlineDraft();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const save = useSaveFlight(tripId);
  const savingRef = useRef(false);

  /** 칸 하나를 고친다 */
  function set<K extends keyof FlightFormValues>(key: K, value: FlightFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  /** 저장 — mutateAsync 라 저장 중 창이 닫혀(언마운트) 버려도 완료를 알린다 */
  function commit(fields: FlightFieldsInput) {
    if (savingRef.current) return;
    savingRef.current = true;
    setError(null);
    void save
      .mutateAsync({ flightId: flight?.id ?? null, fields })
      .then(onSaved, () => undefined)
      .finally(() => {
        savingRef.current = false;
      });
  }

  /** 「완료」 — 검증하고, 일정 카드가 지워지게 되면 먼저 묻는다 */
  function submit() {
    const payload = toFlightFields(values);
    if (!payload.ok) {
      setError(payload.error);
      return;
    }
    if (flight && hasCard && outsideTrip(values.depDate, trip)) setConfirming(true);
    else commit(payload.fields);
  }

  return {
    values,
    set,
    screen,
    toForm: () => setScreen({ kind: "form" }),
    airline,
    /** 「항공편명」 칸 — 지금 항공사 · 편명으로 채워 연다 */
    openAirline: () => {
      const picked = values.airlineCode
        ? { name: values.airlineName, code: values.airlineCode }
        : null;
      airline.start(picked, values.flightNo);
      setScreen({ kind: "airline" });
    },
    /** 「항공편명 등록」 의 「완료」 */
    applyAirline: () => {
      const r = airline.result;
      if (!r) return;
      setValues((v) => ({
        ...v,
        airlineName: r.airline.name,
        airlineCode: r.airline.code,
        flightNo: r.no,
      }));
      setScreen({ kind: "form" });
    },
    openAirport: (which: "dep" | "arr") => setScreen({ kind: "airport", which }),
    /** 공항을 골랐다 */
    pickAirport: (which: "dep" | "arr", code: string) => {
      set(which === "dep" ? "depAirport" : "arrAirport", code);
      setScreen({ kind: "form" });
    },
    complete: isFlightFormComplete(values),
    submit,
    confirming,
    /** 카드 삭제 확인 — 저장(true) · 취소(false) */
    resolveConfirm: (ok: boolean) => {
      setConfirming(false);
      const payload = toFlightFields(values);
      if (ok && payload.ok) commit(payload.fields);
    },
    error: error ?? save.error?.message ?? null,
    saving: save.isPending,
    // 요청이 서버에 가 있는 동안은 닫지 못한다. 오프라인으로 멈춘 동안은 연다
    locked: save.isPending && !save.isPaused,
  };
}

export type FlightFormState = ReturnType<typeof useFlightForm>;
