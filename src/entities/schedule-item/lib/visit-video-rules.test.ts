import { describe, expect, it } from "vitest";

import {
  defaultPosterAt,
  fitsVisitVideoLength,
  isVisitVideoMime,
  videoClock,
  visitVideoKey,
} from "./visit-video-rules";

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

describe("fitsVisitVideoLength", () => {
  it("31초 미만까지 — 30초로 찍은 영상이 30.0x 로 읽힌다", () => {
    expect(fitsVisitVideoLength(0.4)).toBe(true);
    expect(fitsVisitVideoLength(30.04)).toBe(true);
    expect(fitsVisitVideoLength(31)).toBe(false);
  });

  it("길이가 없거나 모르는 영상은 받지 않는다", () => {
    expect(fitsVisitVideoLength(0)).toBe(false);
    expect(fitsVisitVideoLength(Number.NaN)).toBe(false);
    expect(fitsVisitVideoLength(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("defaultPosterAt", () => {
  it("1초 지점, 2초보다 짧으면 가운데", () => {
    expect(defaultPosterAt(12)).toBe(1);
    expect(defaultPosterAt(0.8)).toBe(0.4);
  });
});

describe("videoClock", () => {
  it("분:초 — 초 아래는 버린다", () => {
    expect(videoClock(0)).toBe("0:00");
    expect(videoClock(1)).toBe("0:01");
    expect(videoClock(12.9)).toBe("0:12");
    expect(videoClock(30.04)).toBe("0:30");
    expect(videoClock(75)).toBe("1:15");
  });
});
