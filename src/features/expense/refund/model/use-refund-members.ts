"use client";

import { useUser } from "@/entities/session";
import { useTripMembers } from "@/entities/trip-member";

/** 「누구 것」 에 그릴 멤버 */
export type RefundMember = { id: string; name: string };

/** 「누구 것」 을 고를 멤버 — 나를 먼저. 멤버가 둘 이상일 때만, 혼자면 null(칸 · 칩을 숨긴다) */
export function useRefundMembers(tripId: string): {
  members: RefundMember[] | null;
  meId: string | null;
} {
  const { data: list = [] } = useTripMembers(tripId);
  const { data: user } = useUser();
  const meId = user?.id ?? null;
  if (list.length < 2) return { members: null, meId };
  const members = list
    .toSorted((a, b) => Number(b.user_id === meId) - Number(a.user_id === meId))
    .map((m) => ({ id: m.user_id, name: m.profile.display_name ?? "이름 없음" }));
  return { members, meId };
}

/** 멤버 id → 이름. 없으면(나간 멤버) 「나간 멤버」, id 가 비면 null */
export function memberName(members: RefundMember[], id: string | null): string | null {
  if (!id) return null;
  return members.find((m) => m.id === id)?.name ?? "나간 멤버";
}
