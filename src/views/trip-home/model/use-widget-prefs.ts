"use client";

import { useSyncExternalStore } from "react";

import { DEFAULT_WIDGET_PREFS, parseWidgetPrefs, type WidgetPrefs } from "../lib/widget-prefs";

/** 「홈 위젯 편집」 설정 — 기기별, 모든 여행에 하나 */
const KEY = "tm-home-widgets";

/** 읽은 값. 위젯 줄(요약 탭)과 편집 화면(머리의 「편집」)이 같은 값을 보게 모듈에 하나 둔다 */
let cache: WidgetPrefs | null = null;
const listeners = new Set<() => void>();

/** 저장된 설정. 없거나 저장소가 막혔으면 기본값 */
function read(): WidgetPrefs {
  try {
    return parseWidgetPrefs(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    return DEFAULT_WIDGET_PREFS;
  }
}

/** 지금 설정 — 처음 한 번만 저장소에서 읽는다 */
function snapshot(): WidgetPrefs {
  cache ??= read();
  return cache;
}

/** 설정이 바뀌면 알려 달라고 등록한다 */
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 설정을 바꾼다. 저장소가 막혔으면 이 화면을 여는 동안만 기억한다 */
export function saveWidgetPrefs(next: WidgetPrefs) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장할 수 없으면 이 화면에서만 기억한다
  }
  listeners.forEach((l) => l());
}

/** 홈 위젯 설정 — 서버 렌더에서는 기본값(여행 홈은 화면 폭을 안 뒤에만 그려서 실제로는 쓰이지 않는다) */
export function useWidgetPrefs(): WidgetPrefs {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_WIDGET_PREFS);
}
