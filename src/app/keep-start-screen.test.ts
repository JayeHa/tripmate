import { describe, expect, it } from "vitest";

import { START_URL, startScreenUrls } from "./keep-start-screen";

describe("startScreenUrls", () => {
  it("첫 화면은 늘 담는다", () => {
    expect(startScreenUrls(START_URL)).toEqual([START_URL]);
  });

  it("여행 화면을 보고 있으면 그 화면도 담는다", () => {
    expect(startScreenUrls("/trips/t1/schedule")).toEqual([START_URL, "/trips/t1/schedule"]);
  });

  it("로그인 · 초대 · 인증 주소는 담지 않는다", () => {
    expect(startScreenUrls("/login")).toEqual([START_URL]);
    expect(startScreenUrls("/join/abc")).toEqual([START_URL]);
    expect(startScreenUrls("/auth/callback")).toEqual([START_URL]);
  });
});
