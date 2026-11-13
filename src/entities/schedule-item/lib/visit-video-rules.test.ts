import { describe, expect, it } from "vitest";

import { isVisitVideoMime, visitVideoKey } from "./visit-video-rules";

describe("isVisitVideoMime", () => {
  it("MP4 · MOV · WebM 만", () => {
    expect(isVisitVideoMime("video/mp4")).toBe(true);
    expect(isVisitVideoMime("video/quicktime")).toBe(true);
    expect(isVisitVideoMime("video/x-matroska")).toBe(false);
    expect(isVisitVideoMime("image/jpeg")).toBe(false);
  });
});

describe("visitVideoKey", () => {
  it("여행 폴더 아래 uuid · 확장자, 모르는 종류는 mp4", () => {
    expect(visitVideoKey("t", "u", "video/quicktime")).toBe("t/u.mov");
    expect(visitVideoKey("t", "u", "video/webm")).toBe("t/u.webm");
    expect(visitVideoKey("t", "u", "video/avi")).toBe("t/u.mp4");
  });
});
