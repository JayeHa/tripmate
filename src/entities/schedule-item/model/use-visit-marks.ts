"use client";

import { useState, useSyncExternalStore } from "react";

/** 일정의 다녀감 표시 — 다녀왔어요 · 패스(일정엔 넣었지만 가지 않았다) */
export type VisitMark = "visited" | "skipped";

/** 한 여행의 표시 — 일정 id → 표시. 표시 없는 일정은 순서 · 시각으로 정한다(dayProgress) */
export type VisitMarks = Readonly<Record<string, VisitMark>>;

/** 기기별(일행과 따로 다닐 수 있어서 나누지 않는다). 여행 id → 그 여행의 표시 */
const KEY = "tm-visit-marks";
/** 예전 「들른 수」 기록 — 일정마다의 표시로 바뀌어 읽지 않고 지운다 */
const OLD_KEY = "tm-home-visited";

type Saved = Record<string, VisitMarks>;

const EMPTY: VisitMarks = {};

/** 읽은 값 — 같은 값이면 같은 객체를 돌려줘야 useSyncExternalStore 가 다시 그리지 않는다 */
let cache: Saved | null = null;
const listeners = new Set<() => void>();

/** 객체(배열 아님)인가 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** 한 여행의 표시에서 모양이 맞는 것만 */
function cleanMarks(value: Record<string, unknown>): VisitMarks {
  return Object.fromEntries(
    Object.entries(value).filter(([, m]) => m === "visited" || m === "skipped"),
  ) as VisitMarks;
}

/** 저장된 글 → 표시. 없거나 모양이 다르면 빈 기록(모양이 맞는 여행 · 표시만 남긴다) */
function parse(raw: string | null): Saved {
  try {
    const value: unknown = JSON.parse(raw ?? "{}");
    if (!isRecord(value)) return {};
    return Object.fromEntries(
      Object.entries(value).flatMap(([trip, marks]) =>
        isRecord(marks) ? [[trip, cleanMarks(marks)]] : [],
      ),
    );
  } catch {
    return {};
  }
}

/** 저장된 표시(처음 한 번 읽는다). 저장소가 막혔으면 빈 기록 */
function load(): Saved {
  if (cache) return cache;
  try {
    localStorage.removeItem(OLD_KEY);
    cache = parse(localStorage.getItem(KEY));
  } catch {
    cache = {};
  }
  return cache;
}

/** 저장하고 이 기기의 화면들에 알린다. 막혀 있으면 이번 방문에서만 기억한다 */
function save(next: Saved) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장할 수 없으면 이번 방문에서만 기억한다
  }
  listeners.forEach((l) => l());
}

/** 표시가 바뀌면 알린다 — 같은 탭의 다른 화면(상세 → 타임라인)과 다른 탭(storage 이벤트) */
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = parse(e.newValue);
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** 표시를 하나 바꾼 새 기록 — null 이면 표시를 지운다 */
function withMark(marks: VisitMarks, itemId: string, mark: VisitMark | null): VisitMarks {
  const rest = Object.fromEntries(Object.entries(marks).filter(([id]) => id !== itemId));
  return mark ? { ...rest, [itemId]: mark } : rest;
}

/**
 * 그 여행의 다녀감 표시와 바꾸기 — 홈 「들렀어요」 · 일정 상세 「방문」 이 바꾸고, 홈 「오늘」 카드 · 일정의 회색이 읽는다.
 * 한 기기 안의 화면들이 같은 값을 본다. persist 가 false 면(여행 전에 「여행 중」 을 미리 볼 때) 저장하지 않고 이 화면에서만 기억한다.
 * 서버 렌더에서는 빈 기록이다
 */
export function useVisitMarks(tripId: string, persist = true) {
  const saved = useSyncExternalStore(
    subscribe,
    () => load()[tripId] ?? EMPTY,
    () => EMPTY,
  );
  const [preview, setPreview] = useState<VisitMarks>(EMPTY);
  const marks = persist ? saved : preview;
  /**
   * 일정 하나의 표시를 바꾼다. null 이면 지운다. 부르는 순간의 최신 값에서 바꾼다 —
   * 토스트 「되돌리기」 처럼 나중에 불려도 그 사이에 바꾼 다른 표시를 덮지 않게
   */
  function setMark(itemId: string, mark: VisitMark | null) {
    if (!persist) return setPreview((prev) => withMark(prev, itemId, mark));
    const all = load();
    save({ ...all, [tripId]: withMark(all[tripId] ?? EMPTY, itemId, mark) });
  }
  return [marks, setMark] as const;
}
