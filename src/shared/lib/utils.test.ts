import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("테마의 모서리 · 그림자 이름도 뒤에 준 값으로 덮는다", () => {
    expect(cn("rounded-sheet p-4", "rounded-none")).toBe("p-4 rounded-none");
    expect(cn("rounded-none", "lg:rounded-sheet")).toBe("rounded-none lg:rounded-sheet");
    expect(cn("shadow-sheet", "shadow-none")).toBe("shadow-none");
    expect(cn("rounded-card", "rounded-button")).toBe("rounded-button");
  });
});
