import { describe, expect, it } from "vitest";

import { fitSize } from "./compress-image";

describe("fitSize", () => {
  it("긴 변을 2000 에 맞추고 비율을 지킨다", () => {
    expect(fitSize(4032, 3024)).toEqual({ width: 2000, height: 1500 });
    expect(fitSize(1170, 2532)).toEqual({ width: 924, height: 2000 });
  });

  it("작은 사진은 그대로", () => {
    expect(fitSize(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
