import { describe, expect, it } from "vitest";

import { liveParticipants, livePayer } from "./live-people";

const everyone = ["m:me", "m:a", "g:1"];
/** 이 폼이 본 적 있는 인원 — g:2 는 보였다가 빠졌다 */
const seen = new Set([...everyone, "g:2"]);

describe("liveParticipants", () => {
  it("본 적 있다가 빠진 정산 인원만 뺀다 — 처음부터 목록에 없던 인원 · 떠난 멤버는 남긴다", () => {
    expect(
      liveParticipants(["m:me", "g:1", "g:2", "g:late", "m:left"], everyone, seen, "m:me"),
    ).toEqual(["m:me", "g:1", "g:late", "m:left"]);
  });

  it("다 빠지면 나만", () => {
    expect(liveParticipants(["g:2"], everyone, seen, "m:me")).toEqual(["m:me"]);
  });
});

describe("livePayer", () => {
  it("결제자가 빠진 정산 인원이면 나 — 목록에 아직 없는(늦게 안) 인원은 그대로", () => {
    expect(livePayer("g:2", everyone, seen, "m:me")).toBe("m:me");
    expect(livePayer("g:late", everyone, seen, "m:me")).toBe("g:late");
    expect(livePayer("g:1", everyone, seen, "m:me")).toBe("g:1");
    expect(livePayer(null, everyone, seen, "m:me")).toBeNull();
  });
});
