import { describe, expect, it } from "vitest";
import { cacheBuster } from "./cache-buster";

describe("cacheBuster", () => {
  it("사람이 다르면 값이 달라져 저장본이 버려진다", () => {
    expect(cacheBuster("anon-uuid")).not.toBe(cacheBuster("google-uuid"));
  });

  it("같은 사람이면 값이 같아 캐시를 이어 쓴다", () => {
    expect(cacheBuster("google-uuid")).toBe(cacheBuster("google-uuid"));
  });

  it("로그인 전에는 한 가지 값으로 모인다", () => {
    expect(cacheBuster(null)).toBe(cacheBuster(undefined));
  });

  it("로그인 전 값이 어떤 user id 와도 겹치지 않는다", () => {
    expect(cacheBuster(null)).not.toBe(cacheBuster("anonymous"));
  });
});
