"use client";

import { useState } from "react";

import type { Airline } from "@/entities/flight";

/** 편명 — 숫자 1–4자리 */
const FLIGHT_NO = /^\d{1,4}$/;

/**
 * 「항공편명 등록」 단계의 입력 — 고른 항공사 · 검색어 · 편명. 단계를 열 때 폼 값으로 채우고(start),
 * 항공사를 고르고 편명이 맞으면 「완료」(result)로 폼에 돌려준다. 항공사를 누르면 다시 고른다(clear)
 */
export function useAirlineDraft() {
  const [picked, setPicked] = useState<Airline | null>(null);
  const [query, setQuery] = useState("");
  const [no, setNo] = useState("");
  return {
    picked,
    query,
    no,
    /** 단계를 연다 — 이미 고른 항공사 · 편명이 있으면 그것으로 */
    start: (airline: Airline | null, flightNo: string) => {
      setPicked(airline);
      setQuery("");
      setNo(flightNo);
    },
    pick: setPicked,
    clear: () => setPicked(null),
    setQuery,
    /** 숫자만 4자리까지 */
    setNo: (text: string) => setNo(text.replace(/\D/g, "").slice(0, 4)),
    /** 「완료」 할 수 있으면 항공사와 편명, 아니면 null */
    result: picked && FLIGHT_NO.test(no) ? { airline: picked, no } : null,
  };
}

export type AirlineDraft = ReturnType<typeof useAirlineDraft>;
