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
