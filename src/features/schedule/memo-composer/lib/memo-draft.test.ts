import { describe, expect, it } from "vitest";

import type { Memo } from "@/entities/schedule-item";

import { memoDraftOf, pinnedByOf, samePayload, toMemoPayload } from "./memo-draft";

describe("memoDraftOf", () => {
  it("새 메모는 빈 칸, 고치는 메모는 그 값(모양이 틀린 링크는 버린다)", () => {
    expect(memoDraftOf(null)).toEqual({ body: "", starred: false, pinned: false, links: [] });
    const memo = {
      body: "7층 집합",
      starred: true,
      pinned_by: "u1",
      links: [{ title: "지도", url: "https://m" }, { url: 1 }],
    } as unknown as Memo;
    expect(memoDraftOf(memo)).toEqual({
      body: "7층 집합",
      starred: true,
      pinned: true,
      links: [{ title: "지도", url: "https://m" }],
    });
  });
});

describe("toMemoPayload", () => {
  it("본문은 앞뒤 공백을 떼고, 빈 링크 줄은 버린다", () => {
    expect(
      toMemoPayload({
        body: "  창가석  ",
        starred: false,
        pinned: true,
        links: [
          { title: " 메뉴 ", url: " https://m " },
          { title: "", url: "" },
        ],
      }),
    ).toEqual({
      ok: true,
      value: {
        body: "창가석",
        starred: false,
        pinned: true,
        links: [{ title: "메뉴", url: "https://m" }],
      },
    });
  });

  it("본문이 비거나 500자를 넘거나, 링크가 http(s) 가 아니면 오류", () => {
    expect(toMemoPayload({ body: " ", starred: false, pinned: false, links: [] })).toMatchObject({
      ok: false,
    });
    expect(
      toMemoPayload({ body: "가".repeat(501), starred: false, pinned: false, links: [] }),
    ).toMatchObject({
      ok: false,
    });
    expect(
      toMemoPayload({
        body: "x",
        starred: false,
        pinned: false,
        links: [{ title: "", url: "javascript:x" }],
      }),
    ).toMatchObject({ ok: false });
  });
});

describe("samePayload", () => {
  it("본문 · 중요 · 고정 · 링크가 모두 같을 때만 같다", () => {
    const a = {
      body: "x",
      starred: false,
      pinned: false,
      links: [{ title: "", url: "https://a" }],
    };
    expect(samePayload(a, { ...a, links: [{ title: "", url: "https://a" }] })).toBe(true);
    expect(samePayload(a, { ...a, starred: true })).toBe(false);
    expect(samePayload(a, { ...a, links: [] })).toBe(false);
    expect(samePayload(a, { ...a, pinned: true })).toBe(false);
  });
});

describe("pinnedByOf", () => {
  it("끄면 null, 이미 고정돼 있으면 처음 고정한 사람, 새로 고정하면 나", () => {
    expect(pinnedByOf(false, "u1", "me")).toBeNull();
    expect(pinnedByOf(true, "u1", "me")).toBe("u1");
    expect(pinnedByOf(true, null, "me")).toBe("me");
  });
});
