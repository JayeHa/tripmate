import { describe, expect, it } from "vitest";

import type { TripGuest } from "@/entities/expense";
import type { TripMember } from "@/entities/trip-member";

import { formPeople } from "./people";

/** 테스트용 멤버 — 이름만 다르다 */
function member(id: string, name: string | null): TripMember {
  return { user_id: id, profile: { display_name: name, avatar_url: null } } as TripMember;
}

describe("formPeople", () => {
  it("나를 맨 앞에, 다른 멤버는 그 순서대로, 정산 인원은 뒤에", () => {
    const people = formPeople(
      [member("a", "동규"), member("me", "정원"), member("b", null)],
      [{ id: "g1", name: "서연" } as TripGuest],
      "me",
    );
    expect(people.map((p) => [p.key, p.name, p.guest])).toEqual([
      ["m:me", "정원", false],
      ["m:a", "동규", false],
      ["m:b", "이름 없음", false],
      ["g:g1", "서연", true],
    ]);
  });
});
