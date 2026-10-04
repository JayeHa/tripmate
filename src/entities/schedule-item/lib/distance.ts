/**
 * 카드 사이의 길찾기 pill. Routes API 대신 직선거리로 계산해 비용이 들지 않는다.
 * 정확한 경로는 「경로↗」가 여는 구글맵이 맡는다. 공식은 디자인에서 정한 값이다.
 */

type LatLng = { lat: number; lng: number };

const EARTH_DIAMETER_KM = 12742;

/** 이 거리 이하는 같은 장소로 보고 pill 을 숨긴다 */
export const SAME_PLACE_KM = 0.05;

/** 두 좌표 사이의 지표면 직선거리(km) */
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

/**
 * 1.2km 이하는 도보(13분/km), 그 외는 대중교통 추정치를 5분 단위로.
 * 시안 식은 20km 초과에 기울기 1.15 를 처음부터 곱해 20km 에서 60분 → 31분으로 끊긴다.
 * 20km 까지는 2.6, 넘는 만큼만 1.15 로 이어 붙여 거리가 늘면 시간도 늘게 한다.
 */
export function etaLabel(km: number): string {
  if (km <= 1.2) return `도보 ${Math.max(1, Math.round(km * 13))}분`;
  const raw = km <= 20 ? 8 + km * 2.6 : 8 + 20 * 2.6 + (km - 20) * 1.15;
  const min = Math.round(raw / 5) * 5;
  if (min < 60) return `약 ${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `약 ${h}시간 ${m}분` : `약 ${h}시간`;
}

/** 구글맵 대중교통 길찾기 URL. 앱이 깔려 있으면 앱으로 열린다 */
export function transitRouteUrl(from: LatLng, to: LatLng): string {
  const params = new URLSearchParams({
    api: "1",
    travelmode: "transit",
    origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
