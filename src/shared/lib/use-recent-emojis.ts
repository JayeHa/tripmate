"use client";

import { useState } from "react";

import { pushRecent } from "./emoji";

/** 기기별 최근 이모지 — 일행과 나누지 않는다 */
const KEY = "tm-recent-emoji";

/** 저장된 최근 목록. 사생활 모드 · 막힌 저장소에서는 빈 목록 */
function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((e): e is string => typeof e === "string") : [];
  } catch {
    return [];
  }
}

/** 최근에 고른 이모지(이 기기, 최대 8) — 고르면 맨 앞에 넣고 저장한다. 저장이 막혀도 이번 화면에서는 기억한다 */
export function useRecentEmojis() {
  const [recent, setRecent] = useState<string[]>(load);
  return {
    recent,
    remember: (emoji: string) => {
      const next = pushRecent(recent, emoji);
      setRecent(next);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // 저장할 수 없으면 이 화면에서만 기억한다
      }
    },
  };
}
