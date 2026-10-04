"use client";

import { useCallback, useRef, useState } from "react";

import { findAttachablePlace, type Place } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";

/** 확인 결과 — 찾음 · 없음 · 확인하지 못함(사용자 정보를 아직 못 받았거나 조회 실패) */
export type ExistingCheck = "found" | "none" | "failed";

/**
 * 위치 검색으로 고른 구글 장소가 이미 있는 장소(내 장소 · 이 여행이 쓰는 장소)인지. 있으면 그 장소를 쓸지 묻는 데 쓴다.
 * 확인하는 동안(checking)은 다음 단계로 못 가게 부른 쪽이 막는다 — 확인 전에 넘어가면 구글 장소 id 가 붙은 채 저장돼
 * create_place_schedule 이 내 기존 장소를 고쳐 쓴다. 조회가 끝나기 전에 위치가 또 바뀌면(clear) 늦게 온 결과는 버린다.
 */
export function useExistingPlace(tripId: string) {
  const { data: user } = useUser();
  const [existing, setExisting] = useState<Place | null>(null);
  const [checking, setChecking] = useState(false);
  // 위치를 바꿀 때마다 올리는 순번
  const seqRef = useRef(0);

  /** 위치가 바뀌었다 — 보이던 장소를 지우고 진행 중인 조회 결과를 버린다. 지도 리스너(moveTo)가 쥐므로 같은 함수를 유지한다 */
  const clear = useCallback(() => {
    seqRef.current += 1;
    setExisting(null);
    setChecking(false);
  }, []);

  /** 고른 구글 장소로 이미 있는 장소를 찾는다. 결과를 돌려주고, 그사이 위치가 바뀌었으면 "none" */
  async function check(googleId: string | null): Promise<ExistingCheck> {
    clear();
    if (!googleId) return "none";
    if (!user) return "failed";
    const seq = seqRef.current;
    setChecking(true);
    try {
      const found = await findAttachablePlace(tripId, user.id, googleId);
      if (seqRef.current !== seq) return "none";
      setExisting(found);
      return found ? "found" : "none";
    } catch {
      return seqRef.current === seq ? "failed" : "none";
    } finally {
      if (seqRef.current === seq) setChecking(false);
    }
  }

  return { existing, checking, check, clear };
}
