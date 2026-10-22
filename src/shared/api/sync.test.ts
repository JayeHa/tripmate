import { describe, expect, it } from "vitest";

import { isNetworkError, rememberOwnWrite, updateLatestWins, versionToCompare } from "./sync";

describe("오프라인 편집 대기열", () => {
  it("서버에 닿지 못한 오류 — 브라우저마다 다른 fetch 실패 문구, 서버가 준 오류는 아니다", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(
      isNetworkError({ message: "TypeError: NetworkError when attempting to fetch resource." }),
    ).toBe(true);
    expect(isNetworkError({ message: "Load failed" })).toBe(true);
    expect(isNetworkError({ message: "new row violates row-level security policy" })).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });

  it("같은 항목을 두 번 바꿨으면 두 번째는 내가 만든 버전과 비교한다", () => {
    expect(versionToCompare("a", "v1")).toBe("v1");
    rememberOwnWrite("a", "v1", "v2");
    expect(versionToCompare("a", "v1")).toBe("v2");
    // 다른 버전을 보고 누른 것은 그대로
    expect(versionToCompare("a", "v9")).toBe("v9");
  });

  /** 버전 조건(onlyIf)마다 돌려줄 결과를 정해 둔 가짜 update */
  const fake =
    (whenVersion: string[] | null, whenForced: string[] | null) => (onlyIf: string | null) => {
      const rows = onlyIf ? whenVersion : whenForced;
      return Promise.resolve({
        data: rows?.map((updated_at) => ({ updated_at })) ?? [],
        error: null,
      });
    };

  it("나중 수정 우선 — 본 버전이면 그대로, 그사이 고쳤으면 덮고 알린다, 지워졌으면 던진다", async () => {
    await expect(updateLatestWins(fake(["v2"], null), "v1", "gone")).resolves.toEqual({
      updatedAt: "v2",
      overwrote: false,
    });
    await expect(updateLatestWins(fake([], ["v3"]), "v1", "gone")).resolves.toEqual({
      updatedAt: "v3",
      overwrote: true,
    });
    await expect(updateLatestWins(fake([], []), "v1", "gone")).rejects.toThrow("gone");
  });

  it("오류는 그대로 던진다", async () => {
    const failing = () => Promise.resolve({ data: null, error: new Error("Failed to fetch") });
    await expect(updateLatestWins(failing, "v1", "gone")).rejects.toThrow("Failed to fetch");
  });
});
