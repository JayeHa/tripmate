import { describe, expect, it } from "vitest";

import { isOfflineFileUrl, offlineFileCacheKey, offlineFileUrls } from "./offline-files";

describe("기기에 남기는 사진 주소", () => {
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
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    expect(offlineFileUrls("vouchers", ["t/a.png"])).toEqual({
      "t/a.png": `${base}/vouchers/t/a.png`,
    });
  });
});
