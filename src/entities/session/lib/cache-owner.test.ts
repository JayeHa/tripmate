import { describe, expect, it } from "vitest";
import { decideCacheOwner } from "./cache-owner";

const ANON = "anon-uuid";
const GOOGLE = "google-uuid";

describe("decideCacheOwner", () => {
  it("둘러보기에서 Google 로 갈아타면 캐시를 버린다", () => {
    expect(decideCacheOwner(ANON, GOOGLE)).toBe("drop");
  });

  it("같은 사람이면 캐시를 둔다", () => {
    expect(decideCacheOwner(GOOGLE, GOOGLE)).toBe("keep");
  });

  it("처음 보는 브라우저면 버릴 것이 없다", () => {
    expect(decideCacheOwner(null, GOOGLE)).toBe("keep");
  });
});
