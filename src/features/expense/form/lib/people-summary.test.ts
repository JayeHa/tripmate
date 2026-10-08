import { describe, expect, it } from "vitest";

import { peopleSummary } from "./people-summary";

const names: Record<string, string> = { me: "정원", d: "동규", s: "서연" };
const nameOf = (key: string) => names[key];

describe("peopleSummary", () => {
  it("「N명 모두」 는 지금 사람 목록 수로 — 목록에서 빠진 사람이 남아 있어도 더 세지 않는다", () => {
    expect(
      peopleSummary({
        payer: "me",
        participants: ["me", "d", "gone"],
        allIn: true,
        everyone: 2,
        nameOf,
      }),
    ).toEqual({ lead: "정원", rest: " 결제 · 2명 모두 함께" });
  });

  it("모두 함께", () => {
    expect(
      peopleSummary({ payer: "me", participants: ["me", "d"], allIn: true, everyone: 2, nameOf }),
    ).toEqual({
      lead: "정원",
      rest: " 결제 · 2명 모두 함께",
    });
  });

  it("일부와 함께 — 결제한 사람은 빼고 이름을 잇는다", () => {
    expect(
      peopleSummary({
        payer: "d",
        participants: ["me", "d", "s"].filter((k) => k !== "d"),
        allIn: false,
        everyone: 3,
        nameOf,
      }),
    ).toEqual({ lead: "동규", rest: " 결제 · 정원 · 서연 함께" });
  });

  it("각자 냄 · 혼자", () => {
    expect(
      peopleSummary({ payer: null, participants: ["me", "d"], allIn: true, everyone: 2, nameOf }),
    ).toEqual({
      lead: null,
      rest: "각자 냄 · 2명",
    });
    expect(
      peopleSummary({ payer: "me", participants: ["me"], allIn: false, everyone: 3, nameOf }),
    ).toEqual({
      lead: "정원",
      rest: " 혼자",
    });
  });
});
