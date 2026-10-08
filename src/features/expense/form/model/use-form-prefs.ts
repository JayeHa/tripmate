"use client";

import { useState } from "react";

import { parsePins, type PinField } from "../lib/pins";

/** 기기별 저장값 키 — 위로 고정한 「추가 정보」 칸 · 「누가 내고, 누구와」 카드를 펼쳐 두는지 */
const PINS_KEY = "tm-exp-pins";
const PEOPLE_OPEN_KEY = "tm-exp-people-open";

/** 저장된 값을 JSON 으로 읽는다. 없거나 읽지 못하면(사생활 모드 · 막힌 저장소 · 깨진 값) null */
function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/** 값을 JSON 으로 쓴다. 저장하지 못해도 이 화면에서는 바뀐 값으로 간다 */
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장소가 막혀 있다 — 이 화면에서만 기억한다
  }
}

/**
 * 비용 입력의 기기별 보기 설정 — 일행과 나누지 않는다.
 * 폼은 데이터를 읽은 뒤 클라이언트에서만 그려져(서버는 빈 화면) 첫 렌더에서 읽어도 하이드레이션과 어긋나지 않는다
 */
export function useFormPrefs() {
  const [pins, setPins] = useState<PinField[]>(() => parsePins(read(PINS_KEY)));
  const [peopleOpen, setPeopleOpenState] = useState(() => read(PEOPLE_OPEN_KEY) !== false);

  /** 칸을 고정하거나 푼다 — 바뀐 뒤 고정됐는지 돌려준다(토스트 문구) */
  function togglePin(field: PinField): boolean {
    const pinned = !pins.includes(field);
    const next = pinned ? [...pins, field] : pins.filter((f) => f !== field);
    setPins(next);
    write(PINS_KEY, next);
    return pinned;
  }

  /** 「누가 내고, 누구와」 카드를 펼치거나 접는다. remember 가 false 면 기억하지 않는다(인원을 더해 한 번 펼칠 때) */
  function setPeopleOpen(open: boolean, remember = true) {
    setPeopleOpenState(open);
    if (remember) write(PEOPLE_OPEN_KEY, open);
  }

  return { pins, togglePin, peopleOpen, setPeopleOpen };
}

export type FormPrefs = ReturnType<typeof useFormPrefs>;
