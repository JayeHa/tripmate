import { onlineManager, QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import {
  createSyncDeferral,
  dropDeadEndFailures,
  dropFailedTwins,
  isDuplicateKey,
  isNetworkError,
  OfflineError,
  rememberOwnWrite,
  retrySync,
  saveErrorText,
  updateLatestWins,
  versionToCompare,
} from "./sync";

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

  it("저장 실패 문구 — 오프라인으로 막혔거나 브라우저가 오프라인이면 오프라인 문구, 아니면 화면 문구", () => {
    const offline = "오프라인이에요. 연결되면 다시 해 주세요";
    onlineManager.setOnline(true);
    expect(saveErrorText(new OfflineError(), "저장하지 못했어요")).toBe(offline);
    expect(saveErrorText(new Error("boom"), "저장하지 못했어요")).toBe("저장하지 못했어요");
    expect(saveErrorText(null, "저장하지 못했어요")).toBe("저장하지 못했어요");
    // 파일을 먼저 올리다 서버에 닿지 못한 실패 — 오류는 OfflineError 가 아니지만 브라우저가 오프라인
    onlineManager.setOnline(false);
    expect(saveErrorText(new TypeError("Failed to fetch"), "올리지 못했어요")).toBe(offline);
    onlineManager.setOnline(true);
  });

  it("같은 줄을 다시 넣은 unique 위반만 — 화면에서 만든 id 로 두 번 올라간 저장", () => {
    expect(isDuplicateKey({ code: "23505", message: "duplicate key value" })).toBe(true);
    expect(isDuplicateKey({ code: "23503", message: "foreign key" })).toBe(false);
    expect(isDuplicateKey(new TypeError("Failed to fetch"))).toBe(false);
    expect(isDuplicateKey(null)).toBe(false);
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

  it("다시 해 보는 것은 서버에 닿지 못한 실패만, 3번까지", () => {
    const offline = new TypeError("Failed to fetch");
    expect(retrySync(0, offline)).toBe(true);
    expect(retrySync(3, offline)).toBe(false);
    expect(retrySync(0, new Error("지워진 항목이에요"))).toBe(false);
  });

  /** 늘 error 로 실패하는 대기열 저장을 한 번 올리고, 대기열에 남은 저장 수를 돌려준다 */
  async function remainingAfter(error: Error): Promise<number> {
    const client = new QueryClient();
    dropDeadEndFailures(client);
    client.setMutationDefaults(["sync", "test"], {
      retry: retrySync,
      retryDelay: 0,
      gcTime: Infinity,
      mutationFn: () => Promise.reject(error),
    });
    await client
      .getMutationCache()
      .build(client, { mutationKey: ["sync", "test"] })
      .execute(undefined)
      .catch(() => undefined);
    return client.getMutationCache().getAll().length;
  }

  it("지워짐 · 권한 없음 실패는 대기열에 남지 않는다 — 서버에 닿지 못한 실패만 「다시 시도」 로 남는다", async () => {
    expect(await remainingAfter(new Error("지워진 항목이에요"))).toBe(0);
    expect(await remainingAfter(new TypeError("Failed to fetch"))).toBe(1);
  });

  it("같은 id 로 다시 저장하면 앞서 실패한 저장은 빠진다 — 다른 줄의 실패는 남는다", async () => {
    const client = new QueryClient();
    client.setMutationDefaults(["sync", "test"], {
      retry: false,
      gcTime: Infinity,
      mutationFn: () => Promise.reject(new TypeError("Failed to fetch")),
    });
    const cache = client.getMutationCache();
    for (const id of ["a", "b"]) {
      await cache
        .build(client, { mutationKey: ["sync", "test"] })
        .execute({ id })
        .catch(() => undefined);
    }
    dropFailedTwins(client, ["sync", "test"], "a");
    expect(cache.getAll().map((m) => (m.state.variables as { id: string }).id)).toEqual(["b"]);
  });

  it("대기열이 올라가는 동안 온 다시 읽기는 모아 두었다가 비면 한 번에 — 종류가 달라도 빠지지 않는다", async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue();
    let finish = () => {};
    client.setMutationDefaults(["sync", "check"], {
      mutationFn: () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    });
    const deferral = createSyncDeferral(client);

    deferral.refresh(["expenses"]);
    expect(invalidate).toHaveBeenCalledTimes(1);
    invalidate.mockClear();

    const running = client
      .getMutationCache()
      .build(client, { mutationKey: ["sync", "check"] })
      .execute(undefined);
    await vi.waitFor(() => expect(client.isMutating()).toBe(1));
    deferral.refresh(["expenses"]);
    deferral.refresh(["memos"]);
    deferral.refresh(["expenses"]);
    expect(invalidate).not.toHaveBeenCalled();

    finish();
    await running;
    expect(invalidate.mock.calls.map(([f]) => f?.queryKey)).toEqual([["expenses"], ["memos"]]);
    deferral.stop();
  });
});
