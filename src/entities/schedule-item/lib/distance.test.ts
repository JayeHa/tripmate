import { describe, expect, it } from "vitest";

import { etaLabel, formatKm, haversineKm, transitRouteUrl, walkLabel } from "./distance";

describe("haversineKm", () => {
  it("도쿄역 → 스카이트리 직선 약 5.1km", () => {
    const km = haversineKm({ lat: 35.6812, lng: 139.7671 }, { lat: 35.7101, lng: 139.8107 });
    expect(km).toBeGreaterThan(5.0);
    expect(km).toBeLessThan(5.2);
  });

  it("같은 점은 0", () => {
    expect(haversineKm({ lat: 35, lng: 139 }, { lat: 35, lng: 139 })).toBe(0);
  });
});

describe("formatKm", () => {
  it.each([
    [0.35, "350m"],
    [0.9995, "1000m"],
    [1, "1.0km"],
    [12.34, "12.3km"],
  ])("%s → %s", (km, label) => {
    expect(formatKm(km)).toBe(label);
  });
});

describe("etaLabel", () => {
  it.each([
    [0.06, "도보 1분"],
    [1.2, "도보 16분"],
    [1.3, "약 10분"],
    [5.3, "약 20분"],
    [20, "약 1시간"],
    [21, "약 1시간"],
    [60, "약 1시간 45분"],
    [80, "약 2시간 10분"],
  ])("%skm → %s", (km, label) => {
    expect(etaLabel(km)).toBe(label);
  });

  it("20km 경계에서 시간이 줄지 않는다", () => {
    expect(etaLabel(20)).toBe("약 1시간");
    expect(etaLabel(20.1)).toBe("약 1시간");
  });
});

describe("transitRouteUrl", () => {
  it("구글맵 대중교통 길찾기", () => {
    expect(transitRouteUrl({ lat: 1.5, lng: 2 }, { lat: 3, lng: 4.25 })).toBe(
      "https://www.google.com/maps/dir/?api=1&travelmode=transit&origin=1.5%2C2&destination=3%2C4.25",
    );
  });
});

describe("walkLabel", () => {
  it("× 1.3 ÷ 80m/분, 최소 1분, 걸어서 1.5km 넘으면 km", () => {
    expect(walkLabel(0.01)).toBe("도보 1분");
    expect(walkLabel(0.4)).toBe("도보 7분");
    expect(walkLabel(1.2)).toBe("1.6km");
  });
});
