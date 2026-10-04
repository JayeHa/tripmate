"use client";

import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { findAttachablePlace, type Place } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { queryKeys } from "@/shared/api/query-keys";

/** 확인 결과 — 찾음 · 없음 · 확인하지 못함(사용자 정보를 아직 못 받았거나 조회 실패) */
export type ExistingCheck = "found" | "none" | "failed";

/**
 * 위치 검색으로 고른 구글 장소가 이미 있는 장소(내 장소 · 이 여행이 쓰는 장소)인지. 있으면 그 장소를 쓸지 묻는 데 쓴다.
 * 확인하는 동안(checking)은 다음 단계로 못 가게 부른 쪽이 막는다 — 확인 전에 넘어가면 구글 장소 id 가 붙은 채 저장돼
 * create_place_schedule 이 내 기존 장소를 고쳐 쓴다. 조회가 끝나기 전에 위치가 또 바뀌면(clear) 늦게 온 결과는 버린다.
 */
export function useExistingPlace(tripId: string) {
  // 사용자 쿼리를 구독해 둔다 — 확인할 때는 아래처럼 캐시에서 그 순간의 값을 읽는다
  useUser();
  const qc = useQueryClient();
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

  /**
   * 위치 검색 결과를 고른다 — `pick` 이 구글 상세를 받아 폼에 반영하고 그 장소 id 를 돌려주면, 그 id 로 이미 있는 장소를 찾는다.
   * 고르는 순간부터(상세 조회 중에도) checking 이라 그사이 다음 단계로 못 간다. 그사이 위치가 바뀌었으면 "none".
   * 상세 조회가 실패하면 예외를 그대로 던진다(부른 쪽이 문구를 보인다)
   */
  async function check(pick: () => Promise<string | null>): Promise<ExistingCheck> {
    clear();
    const seq = seqRef.current;
    setChecking(true);
    try {
      const googleId = await pick();
      if (seqRef.current !== seq || !googleId) return "none";
      // 고를 때 잡아 둔 값이 아니라 지금 값 — 상세 조회를 기다리는 사이 사용자 정보가 들어왔을 수 있다
      const user = qc.getQueryData<User | null>(queryKeys.user);
      if (!user) return "failed";
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
