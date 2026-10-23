"use client";

import { useSyncExternalStore } from "react";

import { dropOfflineTrip } from "@/shared/api/offline-files";
import { OFFLINE_TRIPS_KEY } from "@/shared/lib/offline-cache";

import { isExpired, type SavedTrip } from "../lib/offline-plan";

/** 여행 id → 받은 기록 */
export type SavedTrips = Readonly<Record<string, SavedTrip>>;

const EMPTY: SavedTrips = {};
let state: SavedTrips | null = null;
const listeners = new Set<() => void>();
/** 이 탭에서 지금 받고 있는 여행 — 기록이 「받는 중」 인데 여기 없으면 앱을 닫아 끊긴 것 */
const running = new Set<string>();

/** 끊긴 받기 — 남은 것을 받지 못한 것으로 센다 */
function interrupted(saved: SavedTrip): SavedTrip {
  return { ...saved, status: "partial", missing: saved.total - saved.done + saved.failed.length };
}

/** 기기에서 읽는다 — 저장소가 막혔거나 모양이 깨졌으면 빈 기록 */
function load(): SavedTrips {
  try {
    const raw = JSON.parse(localStorage.getItem(OFFLINE_TRIPS_KEY) ?? "{}") as SavedTrips;
    return Object.fromEntries(
      Object.entries(raw).map(([id, s]) => [
        id,
        s.status === "busy" && !running.has(id) ? interrupted(s) : s,
      ]),
    );
  } catch {
    return EMPTY;
  }
}

/** 지금 기록 — 처음 부를 때 기기에서 읽는다 */
function current(): SavedTrips {
  state ??= load();
  return state;
}

/** 바꾼 기록을 기기에 쓰고 알린다 — 쓰지 못해도 이 화면에서는 기억한다 */
function commit(next: SavedTrips): void {
  state = next;
  try {
    localStorage.setItem(OFFLINE_TRIPS_KEY, JSON.stringify(next));
  } catch {
    // 막힌 저장소 — 화면에서만 기억한다
  }
  listeners.forEach((fn) => fn());
}

/** 받은 기록 전부 — 지금 값 */
export function allSavedTrips(): SavedTrips {
  return current();
}

/** 여행 하나의 기록 — 지금 값 */
export function savedTripOf(tripId: string): SavedTrip | undefined {
  return current()[tripId];
}

/** 여행 하나의 기록을 바꾼다. null 이면 지운다 */
export function setSavedTrip(tripId: string, next: SavedTrip | null): void {
  const rest = Object.fromEntries(Object.entries(current()).filter(([id]) => id !== tripId));
  commit(next ? { ...rest, [tripId]: next } : rest);
}

/** 받는 중으로 표시하거나 푼다 */
export function markRunning(tripId: string, on: boolean): void {
  if (on) running.add(tripId);
  else running.delete(tripId);
}

/** 이 탭에서 받고 있는가 — 같은 여행을 두 번 받지 않게 */
export function isRunning(tripId: string): boolean {
  return running.has(tripId);
}

/** 기록 변화를 듣는다 */
function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 받은 기록 전부 — 서버 렌더 · 하이드레이션 동안은 빈 기록(기기 값은 그 뒤에 읽는다) */
export function useSavedTrips(): SavedTrips {
  return useSyncExternalStore(subscribe, current, () => EMPTY);
}

/**
 * 보관 기한이 지난 여행을 지운다 — 기록과 저장 칸(화면 · 사진). 앱이 시작할 때 부른다
 * @param today 오늘(yyyy-MM-dd)
 */
export function pruneOfflineTrips(today: string): void {
  Object.entries(current())
    .filter(([, s]) => isExpired(s, today))
    .forEach(([id]) => {
      setSavedTrip(id, null);
      void dropOfflineTrip(id);
    });
}
