"use client";

import { useUser } from "@/entities/session";
import { useTripMembers } from "@/entities/trip-member";

/** 「누구 거」 칩 · 번호 주인에 그릴 멤버 */
export type OwnerOption = { id: string; name: string; avatarUrl: string | null };

/** 「누구 거」 · 번호 주인에 고를 멤버 — 나를 먼저. 멤버가 둘 이상일 때만, 혼자면 null(고르기를 숨긴다 — 모두 = 나) */
export function useOwnerOptions(tripId: string): OwnerOption[] | null {
  const { data: members = [] } = useTripMembers(tripId);
  const { data: user } = useUser();
  if (members.length < 2) return null;
  return members
    .toSorted((a, b) => Number(b.user_id === user?.id) - Number(a.user_id === user?.id))
    .map((m) => ({
      id: m.user_id,
      name: m.profile.display_name ?? "이름 없음",
      avatarUrl: m.profile.avatar_url,
    }));
}
