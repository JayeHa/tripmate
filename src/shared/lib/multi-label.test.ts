import { describe, expect, it } from "vitest";

import { multiLabel } from "./multi-label";

describe("multiLabel", () => {
  it("없으면 null, 하나면 이름, 여럿이면 「첫 이름 외 N」", () => {
    expect(multiLabel([])).toBeNull();
    expect(multiLabel(["정원"])).toBe("정원");
    expect(multiLabel(["정원", "동규", "서연"])).toBe("정원 외 2");
  });
});
