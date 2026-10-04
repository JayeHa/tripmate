import { describe, expect, it } from "vitest";

import { fitZoom } from "./map-fit";

const HOTEL = { lat: 35.6735, lng: 139.768 };

describe("fitZoom", () => {
  it("한 점(같은 호텔에서 나가고 돌아오는 날)은 무한대 — 상한으로 자른다", () => {
    expect(fitZoom([HOTEL, HOTEL], 390, 190, 36)).toBe(Number.POSITIVE_INFINITY);
  });

  it("한 동네 안(수백 m)에 모이면 15 를 넘는다", () => {
    const near = [HOTEL, { lat: 35.6748, lng: 139.7702 }]; // 약 230m
    expect(fitZoom(near, 390, 190, 36)).toBeGreaterThan(15);
  });

  it("도쿄 시내에 퍼진 하루(수 km)는 15 아래", () => {
    const spread = [
      { lat: 35.6812, lng: 139.7671 },
      { lat: 35.7101, lng: 139.8107 },
      { lat: 35.6895, lng: 139.6917 },
    ];
    const z = fitZoom(spread, 390, 190, 36);
    expect(z).toBeLessThan(15);
    expect(z).toBeGreaterThanOrEqual(10);
  });

  it("화면이 넓을수록 더 확대할 수 있다", () => {
    const spread = [HOTEL, { lat: 35.7101, lng: 139.8107 }];
    expect(fitZoom(spread, 1200, 800, 36)).toBeGreaterThan(fitZoom(spread, 390, 190, 36));
  });
});
