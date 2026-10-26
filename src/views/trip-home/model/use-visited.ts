"use client";

import { useState } from "react";

/** 「들렀어요」 기록 — 기기별(일행과 따로 다닐 수 있어서 나누지 않는다). 여행마다 마지막으로 누른 날의 들른 개수만 둔다 */
const KEY = "tm-home-visited";

type Saved = Record<string, { date: string; count: number }>;

/** 한 여행의 기록 모양이 맞는가 */
function isEntry(v: unknown): v is Saved[string] {
  if (typeof v !== "object" || v === null) return false;
  const { date, count } = v as Record<string, unknown>;
  return typeof date === "string" && Number.isInteger(count) && Number(count) >= 0;
}

/** 저장된 기록. 없거나 모양이 다르거나 저장소가 막혔으면 빈 기록(모양이 맞는 여행만 남긴다) */
function read(): Saved {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, v]) => isEntry(v)));
  } catch {
    return {};
  }
}

/** 저장한다. 막혀 있으면 이번 화면에서만 기억한다 */
function write(saved: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // 저장할 수 없으면 이 화면에서만 기억한다
  }
}

/**
 * 그 여행 그날 들른 장소 수와 바꾸기. 다른 날의 기록은 0 으로 본다(날이 바뀌면 처음부터).
 * localStorage 를 첫 렌더에서 읽는다 — 여행 홈은 화면 폭을 안 뒤(클라이언트)에만 그려서 하이드레이션과 어긋나지 않는다
 */
export function useVisited(tripId: string, date: string) {
  const [saved, setSaved] = useState(read);
  const entry = saved[tripId];
  const count = entry?.date === date ? entry.count : 0;
  /** 들른 수를 바꾸고 저장한다 */
  function setCount(next: number) {
    const all = { ...saved, [tripId]: { date, count: next } };
    setSaved(all);
    write(all);
  }
  return [count, setCount] as const;
}
