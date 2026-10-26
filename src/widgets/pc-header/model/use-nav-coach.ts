"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useHydrated } from "@/shared/lib/use-hydrated";

/** 첫 방문 안내를 닫았는지 — 기기별로 기억한다 */
const SEEN_KEY = "tm-pcnav-coach-seen";

/** 저장된 값. 사생활 모드 · 막힌 저장소에서는 null */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 저장한다. 막혀 있으면 이번 화면에서만 기억한다 */
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 저장할 수 없으면 이 화면에서만 기억한다
  }
}

/**
 * PC 상단 메뉴 첫 방문 안내를 띄울지. `enabled`(여행 홈)일 때 한 번도 닫지 않았으면 띄우고,
 * 주소에 `?coach=1` 이 있으면 닫은 적이 있어도 띄운다(확인용).
 * localStorage 는 하이드레이션 뒤에 읽는다 — 헤더는 서버에서도 그려져 첫 렌더에서 읽으면 어긋난다
 */
export function useNavCoach(enabled: boolean) {
  const hydrated = useHydrated();
  const forced = useSearchParams().get("coach") === "1";
  const [dismissed, setDismissed] = useState(false);

  return {
    open: enabled && hydrated && !dismissed && (forced || read(SEEN_KEY) === null),
    dismiss: () => {
      write(SEEN_KEY, "1");
      setDismissed(true);
    },
  };
}
