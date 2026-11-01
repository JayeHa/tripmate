import { describe, expect, it } from "vitest";

import { coordsMapsUrl, directionsUrl, googleMapsUrl } from "./picked-location";

describe("구글맵 링크", () => {
  it("좌표 검색 · 지금 위치에서 길찾기", () => {
    expect(coordsMapsUrl(35.7, 139.8)).toBe(
      "https://www.google.com/maps/search/?api=1&query=35.7,139.8",
    );
    expect(directionsUrl(35.7, 139.8)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=35.7,139.8",
    );
  });
});

describe("googleMapsUrl", () => {
  it("이름 · 장소 id 로 지도 URL 을 만든다(인코딩)", () => {
    expect(googleMapsUrl("이치란 시부야점", "ChIJ1")).toBe(
      "https://www.google.com/maps/search/?api=1&query=%EC%9D%B4%EC%B9%98%EB%9E%80%20%EC%8B%9C%EB%B6%80%EC%95%BC%EC%A0%90&query_place_id=ChIJ1",
    );
  });
});
