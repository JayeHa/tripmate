import { describe, expect, it } from "vitest";

import { withKeys } from "./keys";

describe("withKeys", () => {
  it("중복되는 값은 몇 번째인지 덧붙여 key 가 겹치지 않는다", () => {
    const keys = withKeys(["현금", "카드", "현금", "현금"], (v) => v).map((k) => k.key);
    expect(keys).toEqual(["현금", "카드", "현금#2", "현금#3"]);
  });
});
