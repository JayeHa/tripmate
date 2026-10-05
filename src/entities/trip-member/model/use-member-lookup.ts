"use client";

import { useCallback, useMemo } from "react";

import { useTripMembers } from "./use-trip-members";

/** 멤버 표시 — 이름(아바타 첫 글자) · 사진 */
export type MemberBadge = { name: string; avatarUrl: string | null };

/**
 * 사용자 id → 이 여행 멤버의 이름 · 사진. 멤버가 아니면(나간 사람 · 지운 계정) null.
 * 메모 작성자처럼 id 만 가진 기록을 그릴 때 쓴다. 같은 함수를 유지해 목록이 다시 그려질 때 새로 만들지 않는다
 */
export function useMemberLookup(tripId: string) {
  const { data: members = [] } = useTripMembers(tripId);
  const byId = useMemo(
    () =>
      new Map(
        members.map((m): [string, MemberBadge] => [
          m.user_id,
          { name: m.profile.display_name ?? "이름 없음", avatarUrl: m.profile.avatar_url },
        ]),
      ),
    [members],
  );
  return useCallback(
    (userId: string | null) => (userId ? (byId.get(userId) ?? null) : null),
    [byId],
  );
}
