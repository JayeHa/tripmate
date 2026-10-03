import { CITY_IMAGES } from "@/shared/config/city-images";
import type { TripCity } from "../api/trips";

/** 목록의 「N개 도시」. 도시를 아직 고르지 않은 여행(목적지 이전에서 못 맞춘 것 포함)은 「도시 미정」. */
export function cityCountLabel(cities: readonly TripCity[]) {
  return cities.length > 0 ? `${cities.length}개 도시` : "도시 미정";
}

/**
 * 여행 썸네일 사진. 사진이 있는 첫 도시를 쓰고, 하나도 없으면 null(틴트로 대신).
 * `images` 는 테스트에서 사진 목록을 바꿔 끼우려고 받는다.
 */
export function coverImageUrl(cities: readonly TripCity[], images = CITY_IMAGES) {
  for (const c of cities) if (images[c.id]) return images[c.id];
  return null;
}
