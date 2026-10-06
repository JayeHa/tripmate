import { describe, expect, it } from "vitest";

import { settleBandState } from "./settle-band";

const me = "m:me";

describe("settleBandState", () => {
  it("받을 돈이 있으면 recv — 여러 명이면 사람과 합계를 모은다", () => {
    expect(
      settleBandState(
        [
          { from: "m:k", to: me, amount: 54210 },
          { from: "g:s", to: me, amount: 27090 },
        ],
        me,
        true,
      ),
    ).toEqual({ kind: "recv", people: ["m:k", "g:s"], amount: 81300 });
  });

  it("보낼 돈이 있으면 send", () => {
    expect(settleBandState([{ from: me, to: "g:s", amount: 12000 }], me, true)).toEqual({
      kind: "send",
      people: ["g:s"],
      amount: 12000,
    });
  });

  it("나는 끝났고 일행끼리 남았으면 done + 남은 수, 아무것도 안 남았으면 0", () => {
    expect(settleBandState([{ from: "m:k", to: "g:s", amount: 1000 }], me, true)).toEqual({
      kind: "done",
      pending: 1,
    });
    expect(settleBandState([], me, true)).toEqual({ kind: "done", pending: 0 });
  });

  it("나눠 낸 비용이 없으면 none", () => {
    expect(settleBandState([], me, false)).toEqual({ kind: "none" });
  });
});
