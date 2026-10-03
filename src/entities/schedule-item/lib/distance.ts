/**
 * 카드 사이의 길찾기 pill. Routes API 대신 직선거리로 계산해 비용이 들지 않는다.
 * 정확한 경로는 「경로↗」가 여는 구글맵이 맡는다. 공식은 시안(README 4번)을 따른다.
 */

type LatLng = { lat: number; lng: number };

const EARTH_DIAMETER_KM = 12742;

/** 이 거리 이하는 같은 장소로 보고 pill 을 숨긴다 */
export const SAME_PLACE_KM = 0.05;

export function haversineKm(a: LatLng, b: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_DIAMETER_KM * Math.asin(Math.sqrt(h));
}

/** 1km 미만은 m, 이상은 소수 한 자리 km */
export function formatKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

/** 1.2km 이하는 도보(13분/km), 그 외는 대중교통 추정치를 5분 단위로 */
export function etaLabel(km: number): string {
  if (km <= 1.2) return `도보 ${Math.max(1, Math.round(km * 13))}분`;
  const min = Math.round((8 + km * (km > 20 ? 1.15 : 2.6)) / 5) * 5;
  if (min < 60) return `약 ${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `약 ${h}시간 ${m}분` : `약 ${h}시간`;
}

export function transitRouteUrl(from: LatLng, to: LatLng): string {
  const params = new URLSearchParams({
    api: "1",
    travelmode: "transit",
    origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
