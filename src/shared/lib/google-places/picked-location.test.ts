import { describe, expect, it } from "vitest";

import { coordsMapsUrl, directionsUrl } from "./picked-location";

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
