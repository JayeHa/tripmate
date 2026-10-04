/**
 * 점들을 지도 화면에 담을 때 fitBounds 가 고를 줌을 미리 계산한다(Web Mercator, 타일 256px).
 * Google Maps 의 fitBounds 는 줌 상한 옵션이 없고 결과가 비동기로 적용돼서, 상한을 걸려면
 * idle 을 기다려야 했다. 직접 계산하면 기다릴 필요 없이 상한보다 크면 중심 + 상한 줌으로 바로 맞출 수 있다.
 */

type LatLng = { lat: number; lng: number };

const TILE_PX = 256;

/** 위도를 Mercator y(라디안, ±π 로 자름)로 */
function mercatorY(lat: number): number {
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = Math.log((1 + sin) / (1 - sin)) / 2;
  return Math.max(Math.min(y, Math.PI), -Math.PI) / 2;
}

/** 화면 px 에 세계의 fraction 만큼을 담는 가장 큰 정수 줌. fraction 이 0 이면 무한대 */
function zoomFor(screenPx: number, fraction: number): number {
  if (fraction <= 0) return Number.POSITIVE_INFINITY;
  return Math.floor(Math.log2(screenPx / TILE_PX / fraction));
}

/**
 * 점들을 width × height 화면(사방 padding 제외)에 모두 담는 최대 줌.
 * 점이 하나거나 모두 같은 좌표면 무한대 — 호출하는 쪽이 상한으로 자른다.
 */
export function fitZoom(points: LatLng[], width: number, height: number, padding: number): number {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const latFraction = (mercatorY(Math.max(...lats)) - mercatorY(Math.min(...lats))) / Math.PI;
  const lngFraction = (Math.max(...lngs) - Math.min(...lngs)) / 360;
  return Math.min(
    zoomFor(height - 2 * padding, latFraction),
    zoomFor(width - 2 * padding, lngFraction),
  );
}
