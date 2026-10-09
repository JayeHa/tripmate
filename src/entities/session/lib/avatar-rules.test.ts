import { describe, expect, it } from "vitest";

import { avatarKey, avatarKeyOf, isAvatarMime, isOwnAvatarKey } from "./avatar-rules";

const BASE = "https://x.supabase.co/storage/v1/object/public/avatars/";

describe("avatar-rules", () => {
  it("받는 종류 — 사진 세 가지만(HEIC 는 줄인 뒤 JPEG 이 된다)", () => {
    expect(isAvatarMime("image/jpeg")).toBe(true);
    expect(isAvatarMime("image/heic")).toBe(false);
  });

  it("키는 사용자 폴더 아래, 남의 폴더 · 상위 경로 · 더 깊은 경로는 아니다", () => {
    expect(avatarKey("u1", "abc", "image/webp")).toBe("u1/abc.webp");
    expect(isOwnAvatarKey("u1", "u1/abc.jpg")).toBe(true);
    expect(isOwnAvatarKey("u1", "u2/abc.jpg")).toBe(false);
    expect(isOwnAvatarKey("u1", "u1/../u2/abc.jpg")).toBe(false);
    expect(isOwnAvatarKey("u1", "u1/a/b.jpg")).toBe(false);
  });

  it("공개 주소에서 키 — 우리 버킷이 아니면 null", () => {
    expect(avatarKeyOf(`${BASE}u1/abc.jpg`, BASE)).toBe("u1/abc.jpg");
    expect(avatarKeyOf("https://lh3.googleusercontent.com/a/x", BASE)).toBeNull();
    expect(avatarKeyOf(null, BASE)).toBeNull();
  });
});
