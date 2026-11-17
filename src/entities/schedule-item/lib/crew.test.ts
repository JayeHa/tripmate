import { describe, expect, it } from "vitest";

import { type CrewMember, crewRating, ratingBoard, uploaderOf } from "./crew";

/** 멤버 한 명 */
function member(id: string): CrewMember {
  return { id, name: id, avatarUrl: null };
}

describe("crewRating", () => {
  it("나를 뺀 일행마다 별점, 안 매겼으면 null", () => {
    const crew = crewRating([member("me"), member("a"), member("b")], "me", { a: 4 });
    expect(crew?.people.map((p) => [p.id, p.stars])).toEqual([
      ["a", 4],
      ["b", null],
    ]);
    expect(crew?.more).toBe(0);
  });

  it("혼자 여행이면 null", () => {
    expect(crewRating([member("me")], "me", { me: 5 })).toBeNull();
  });

  it("평균은 매긴 멤버(나 포함)가 2명 이상일 때만, 소수 한 자리 — 나간 사람은 세지 않는다", () => {
    const members = [member("me"), member("a"), member("b")];
    expect(crewRating(members, "me", { me: 5 })?.average).toBeNull();
    expect(crewRating(members, "me", { me: 5, a: 4 })?.average).toBe(4.5);
    expect(crewRating(members, "me", { me: 5, a: 4, b: 4 })?.average).toBe(4.3);
    expect(crewRating(members, "me", { me: 5, gone: 1 })?.average).toBeNull();
  });

  it("일행이 4명을 넘으면 3명 + 나머지 수", () => {
    const members = ["me", "a", "b", "c", "d", "e"].map(member);
    const crew = crewRating(members, "me", {});
    expect(crew?.people.map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(crew?.more).toBe(2);
    expect(crewRating(members.slice(0, 5), "me", {})?.people).toHaveLength(4);
  });
});

describe("uploaderOf", () => {
  const members = [member("me"), member("a")];

  it("올린 사람을 멤버에서 찾는다 — 새로 고른 사진(null)은 나", () => {
    expect(uploaderOf(members, "me", "a")?.id).toBe("a");
    expect(uploaderOf(members, "me", null)?.id).toBe("me");
  });

  it("혼자 여행이거나 나간 사람이면 null", () => {
    expect(uploaderOf([member("me")], "me", "me")).toBeNull();
    expect(uploaderOf(members, "me", "gone")).toBeNull();
    expect(uploaderOf(members, null, null)).toBeNull();
  });
});

describe("ratingBoard", () => {
  const members = [member("a"), member("me"), member("b")];

  it("멤버 모두 한 줄씩 — 나 먼저, 안 매겼으면 null", () => {
    const board = ratingBoard(members, "me", { me: 5, b: 4 });
    expect(board?.people.map((p) => [p.id, p.stars, p.me])).toEqual([
      ["me", 5, true],
      ["a", null, false],
      ["b", 4, false],
    ]);
  });

  it("평균 · 사람 수는 매긴 멤버만 — 한 명이어도 보이고, 나간 사람은 세지 않는다", () => {
    expect(ratingBoard(members, "me", { me: 5, b: 4 })).toMatchObject({ average: 4.5, count: 2 });
    expect(ratingBoard(members, "me", { a: 3, gone: 1 })).toMatchObject({ average: 3, count: 1 });
    expect(ratingBoard(members, "me", {})).toMatchObject({ average: null, count: 0 });
  });

  it("혼자 여행이면 null", () => {
    expect(ratingBoard([member("me")], "me", { me: 5 })).toBeNull();
  });
});
