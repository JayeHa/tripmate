/**
 * 지도에서 고른 위치 하나 — 장소 입력 폼의 「위치만 고르기」 가 돌려주고, 숙소 폼이 받는다.
 * 두 기능이 서로를 import 하지 않고 같은 모양을 쓰게 shared 에 둔다. 주소 세 줄은 핀 위치에서 불러온 것(못 불러왔으면 null)
 */
export type PickedLocation = {
  lat: number;
  lng: number;
  /** 위치 검색으로 고른 구글 장소. 지도를 끌어 정했으면 null */
  googlePlaceId: string | null;
  /** 고른 구글 장소의 이름. 지도를 끌어 정했으면 "" */
  name: string;
  address: string | null;
  addressLocal: string | null;
  addressKo: string | null;
  /** 구글맵 링크 — 구글 장소면 그 장소, 아니면 좌표 검색 */
  gmapUrl: string;
};

/** 좌표로 여는 구글맵 링크 — 지도를 끌어 정한 위치(구글 장소 없음)용 */
export function coordsMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** 지금 위치에서 그 좌표까지 구글맵 길찾기 — 출발지를 비우면 구글맵이 지금 위치로 잡는다. 앱이 깔려 있으면 앱으로 열린다 */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * 구글 장소 id 로 구글맵 링크를 만든다(지도 URL — API 호출 · 과금이 없다). 장소 id 는 약관상 저장해도 되는 값이다.
 * @see https://developers.google.com/maps/documentation/urls/get-started#search-action
 */
export function googleMapsUrl(name: string, placeId: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${encodeURIComponent(placeId)}`;
}
