import { describe, expect, it } from "vitest";

import { nextDraftReceipts } from "./draft-receipts";

/** 영수증 한 장 */
const r = (key: string) => ({ key, name: `${key}.jpg`, mime: "image/jpeg", size: 1 });

describe("nextDraftReceipts", () => {
  it("남긴 것 뒤에 새로 올린 것을 붙인다", () => {
    expect(nextDraftReceipts([r("a")], { attach: [r("b")], detach: [] })).toEqual({
      receipts: [r("a"), r("b")],
      dropped: [],
    });
  });

  it("뺀 초안 영수증은 빠지고 지울 키로 돌려준다", () => {
    expect(
      nextDraftReceipts([r("a"), r("b")], { attach: [], detach: [{ id: "a", key: "a" }] }),
    ).toEqual({ receipts: [r("b")], dropped: ["a"] });
  });
});
