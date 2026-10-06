import { personKey, type TripGuest } from "@/entities/expense";
import type { TripMember } from "@/entities/trip-member";

import type { FormPerson } from "../model/use-people-picker";

/** 폼에서 고를 사람 — 나 · 다른 멤버(여행 멤버 순) · 정산 인원(넣은 순) */
export function formPeople(members: TripMember[], guests: TripGuest[], me: string): FormPerson[] {
  const memberPeople = members
    .toSorted((a, b) => Number(b.user_id === me) - Number(a.user_id === me))
    .map((m) => ({
      key: personKey({ kind: "member", id: m.user_id }),
      name: m.profile.display_name ?? "이름 없음",
      guest: false,
      avatarUrl: m.profile.avatar_url,
    }));
  const guestPeople = guests.map((g) => ({
    key: personKey({ kind: "guest", id: g.id }),
    name: g.name,
    guest: true,
    avatarUrl: null,
  }));
  return [...memberPeople, ...guestPeople];
}
