import { describe, expect, it } from "vitest";

import { liveParticipants, livePayer } from "./live-people";

const everyone = ["m:me", "m:a", "g:1"];

describe("liveParticipants", () => {
  it("그사이 빠진 정산 인원은 뺀다 — 목록에 없는 멤버(떠난 멤버의 옛 기록)는 남긴다", () => {
    expect(liveParticipants(["m:me", "g:1", "g:2", "m:left"], everyone, "m:me")).toEqual([
      "m:me",
      "g:1",
      "m:left",
    ]);
  });

  it("다 빠지면 나만", () => {
    expect(liveParticipants(["g:2"], everyone, "m:me")).toEqual(["m:me"]);
  });
});

describe("livePayer", () => {
  it("결제자가 그사이 빠진 정산 인원이면 나, 아니면 그대로", () => {
    expect(livePayer("g:2", everyone, "m:me")).toBe("m:me");
    expect(livePayer("g:1", everyone, "m:me")).toBe("g:1");
    expect(livePayer(null, everyone, "m:me")).toBeNull();
  });
});
