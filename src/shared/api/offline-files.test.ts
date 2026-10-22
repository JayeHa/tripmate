import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isOfflineFileUrl,
  isUnreachable,
  offlineFileCacheKey,
  offlineFileUrls,
  withOfflineFileUrls,
} from "./offline-files";
import { ApiError } from "./post-json";

describe("기기에 남기는 사진 주소", () => {
  // 오프라인 주소는 Supabase 주소로 만든다 — 테스트마다 넣고 끝나면 되돌린다
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co"));
  afterEach(() => vi.unstubAllEnvs());

  const base = "https://abc.supabase.co/storage/v1/object/sign";

  it("두 버킷의 서명 주소만 저장한다 — 다른 버킷 · 공개 주소 · 다른 도메인은 아니다", () => {
    expect(isOfflineFileUrl(new URL(`${base}/vouchers/t/a.png?token=x`))).toBe(true);
    expect(isOfflineFileUrl(new URL(`${base}/pack-photos/t/a.jpg?token=x`))).toBe(true);
    expect(isOfflineFileUrl(new URL(`${base}/receipts/t/a.jpg?token=x`))).toBe(false);
    expect(
      isOfflineFileUrl(new URL("https://abc.supabase.co/storage/v1/object/public/avatars/u/a.jpg")),
    ).toBe(false);
    expect(isOfflineFileUrl(new URL("https://example.com/storage/v1/object/sign/vouchers/a"))).toBe(
      false,
    );
  });

  it("저장 키는 token 을 뺀 주소, 오프라인 주소는 그 키와 같다", () => {
    const signed = `${base}/vouchers/t/a.png?token=x`;
    expect(offlineFileCacheKey(signed)).toBe(`${base}/vouchers/t/a.png`);
    expect(offlineFileUrls("vouchers", ["t/a.png"])).toEqual({
      "t/a.png": `${base}/vouchers/t/a.png`,
    });
  });

  it("서버에 닿지 못한 실패만 — 끊김(0) · 503 · 504, 권한(403) · 서버 오류(500)는 아니다", () => {
    expect(isUnreachable(new ApiError("x", 0))).toBe(true);
    expect(isUnreachable(new ApiError("x", 503))).toBe(true);
    expect(isUnreachable(new ApiError("x", 403))).toBe(false);
    expect(isUnreachable(new ApiError("x", 500))).toBe(false);
    expect(isUnreachable(new TypeError("x"))).toBe(false);
  });

  it("오프라인 주소는 닿지 못했고 지금 키의 주소가 없을 때만 — 앞 키 묶음(placeholder)이면 바꾼다", () => {
    const offline = new ApiError("x", 0);
    const keys = ["t/a.png"];
    const signed = { "t/a.png": "signed" };
    const q = (
      data: Record<string, string> | undefined,
      isPlaceholderData: boolean,
      failureReason: unknown,
    ) => ({ data, isPlaceholderData, failureReason });
    expect(withOfflineFileUrls(q(undefined, false, null), "vouchers", keys).data).toBeUndefined();
    expect(
      withOfflineFileUrls(q(undefined, false, new ApiError("x", 403)), "vouchers", keys).data,
    ).toBeUndefined();
    expect(withOfflineFileUrls(q(signed, false, offline), "vouchers", keys).data).toBe(signed);
    expect(withOfflineFileUrls(q(undefined, false, offline), "vouchers", keys).data).toEqual({
      "t/a.png": `${base}/vouchers/t/a.png`,
    });
    expect(
      withOfflineFileUrls(q({ "t/old.png": "s" }, true, offline), "vouchers", keys).data,
    ).toEqual({ "t/a.png": `${base}/vouchers/t/a.png` });
  });
});
