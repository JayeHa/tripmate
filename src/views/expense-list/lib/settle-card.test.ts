import { describe, expect, it } from "vitest";

import type { PersonRef } from "@/entities/expense";

import { settleCardView } from "./settle-card";

/** 사람 — 키는 m:id */
function person(id: string, spent: number, paid: number) {
  return { person: { kind: "member", id } as PersonRef, spent, paid };
}

const ME = "m:me";
const six = [
  person("a", 100, 100),
  person("me", 100, 150),
  person("b", 100, 400),
  person("c", 100, 0),
  person("d", 100, 90),
  person("e", 100, 60),
];

describe("settleCardView — 사람", () => {
  it("(나) 맨 위 + 차액 큰 순 2명, 나머지는 숨김", () => {
    const v = settleCardView(six, [], ME, false);
    expect(v.shown.map((p) => p.person.id)).toEqual(["me", "b", "c"]);
    expect(v.hidden.map((p) => p.person.id)).toEqual(["e", "d", "a"]);
  });

  it("나를 모르면 차액 큰 순 3명, 3명 이하면 숨김 없음", () => {
    expect(settleCardView(six, [], null, false).shown.map((p) => p.person.id)).toEqual([
      "b",
      "c",
      "me",
    ]);
    expect(settleCardView(six.slice(0, 3), [], ME, false).hidden).toEqual([]);
  });
});

describe("settleCardView — 송금", () => {
  const t = (from: string, to: string) => ({ from: `m:${from}`, to: `m:${to}`, amount: 10 });

  it("내 송금 2건까지(받을 것 먼저), 나머지는 「외 N건 · 내 송금 a건 + 일행끼리 b건」", () => {
    const v = settleCardView(
      six,
      [t("me", "b"), t("c", "me"), t("me", "x"), t("d", "b")],
      ME,
      false,
    );
    expect(v.mine).toEqual([t("c", "me"), t("me", "b")]);
    expect(v.mineCount).toBe(3);
    expect(v.rest).toEqual({ text: "외 2건 · 내 송금 1건 + 일행끼리 1건", mineDone: false });
    expect(v.none).toBeNull();
  });

  it("한쪽만 남으면 그 이름만, 다 보이면 회색 줄 없음", () => {
    expect(
      settleCardView(six, [t("c", "me"), t("d", "me"), t("d", "b")], ME, false).rest?.text,
    ).toBe("외 1건 · 일행끼리");
    expect(
      settleCardView(six, [t("c", "me"), t("d", "me"), t("e", "me")], ME, false).rest?.text,
    ).toBe("외 1건 · 내 송금");
    expect(settleCardView(six, [t("c", "me")], ME, false).rest).toBeNull();
  });

  it("내 송금이 없으면 「내 정산은 끝났어요」, 남은 송금이 없으면 한 줄", () => {
    expect(settleCardView(six, [t("d", "b"), t("c", "b")], ME, false).rest).toEqual({
      text: "내 정산은 끝났어요 · 일행 정산 2건 남음",
      mineDone: true,
    });
    expect(settleCardView(six, [], ME, true).none).toBe("모두 정산됐어요");
    expect(settleCardView(six, [], ME, false).none).toBe(
      "각자 낸 만큼 썼어요 · 정산할 금액이 없어요",
    );
  });
});
