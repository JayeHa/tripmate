import { describe, expect, it } from "vitest";

import type { Memo } from "@/entities/schedule-item";

import { memoDraftOf, toMemoPayload } from "./memo-draft";

describe("memoDraftOf", () => {
  it("새 메모는 빈 칸, 고치는 메모는 그 값(모양이 틀린 링크는 버린다)", () => {
    expect(memoDraftOf(null)).toEqual({ body: "", starred: false, links: [] });
    const memo = {
      body: "7층 집합",
      starred: true,
      links: [{ title: "지도", url: "https://m" }, { url: 1 }],
    } as unknown as Memo;
    expect(memoDraftOf(memo)).toEqual({
      body: "7층 집합",
      starred: true,
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
        links: [
          { title: " 메뉴 ", url: " https://m " },
          { title: "", url: "" },
        ],
      }),
    ).toEqual({
      ok: true,
      value: { body: "창가석", starred: false, links: [{ title: "메뉴", url: "https://m" }] },
    });
  });

  it("본문이 비거나 500자를 넘거나, 링크가 http(s) 가 아니면 오류", () => {
    expect(toMemoPayload({ body: " ", starred: false, links: [] })).toMatchObject({ ok: false });
    expect(toMemoPayload({ body: "가".repeat(501), starred: false, links: [] })).toMatchObject({
      ok: false,
    });
    expect(
      toMemoPayload({ body: "x", starred: false, links: [{ title: "", url: "javascript:x" }] }),
    ).toMatchObject({ ok: false });
  });
});
