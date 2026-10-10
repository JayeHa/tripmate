import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, postJson } from "./post-json";

/** fetch 가 이 응답을 돌려주게 */
function respond(status: number, body: string) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postJson", () => {
  it("성공하면 JSON", async () => {
    respond(200, '{"url":"u"}');
    await expect(postJson("/api/x", {}, "실패")).resolves.toEqual({ url: "u" });
  });

  it("실패하면 서버가 보낸 문구와 상태 코드", async () => {
    respond(403, '{"error":"권한이 없어요"}');
    await expect(postJson("/api/x", {}, "실패")).rejects.toMatchObject({
      message: "권한이 없어요",
      status: 403,
    });
  });

  it("문구가 없거나 응답이 깨졌으면 fallback", async () => {
    respond(500, "<html>");
    await expect(postJson("/api/x", {}, "실패")).rejects.toMatchObject({
      message: "실패",
      status: 500,
    });
    respond(200, "not json");
    await expect(postJson("/api/x", {}, "실패")).rejects.toBeInstanceOf(ApiError);
  });

  it("네트워크가 끊겼으면 상태 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(postJson("/api/x", {}, "실패")).rejects.toMatchObject({
      message: "실패",
      status: 0,
    });
  });
});
