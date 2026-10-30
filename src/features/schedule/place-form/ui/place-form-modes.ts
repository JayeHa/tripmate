import type { Place, PlaceCategory, ScheduleItem } from "@/entities/schedule-item";
import type { PickedLocation, SearchCity } from "@/shared/lib/google-places";

import type { GuideSaved } from "../model/use-guide-place-form";

/** 일정 직접 추가 — ① 위치 선택 → ② 장소 정보, 「day N에 담기」로 그날 끝에 담는다 */
export type AddMode = {
  kind: "add";
  dayIndex: number;
  /** 위치 검색칸의 처음 값(일정 추가 화면의 검색어) */
  initialQuery: string;
  /** 있으면 그날 끝이 아니라 이 일정의 대체 장소로 담는다(일정 상세의 대체 장소 「+ 직접 추가」) */
  alternativeOf?: ScheduleItem | null;
  /** 담기에 성공하면 부른다(폼은 부른 쪽이 닫는다) */
  onSaved: () => void;
};

/** 장소 정보 수정 — ② 부터 열고(단계 표시 없음) 「저장」 */
export type EditMode = {
  kind: "edit";
  place: Place;
  /** 저장했거나 바뀐 칸이 없어 끝나면 부른다(폼은 부른 쪽이 닫는다). changed 는 실제로 고쳤는지 */
  onSaved: (changed: boolean) => void;
};

/** 가이드 장소 추가 — ① 위치 선택 → ② 장소 정보, 「장소 저장」 으로 이 여행 보관함에 넣는다(일정은 만들지 않는다) */
export type GuideMode = {
  kind: "guide";
  /** 처음 카테고리(지금 탭). 구글 장소를 고르면 그 카테고리로 바뀐다 */
  category: PlaceCategory | null;
  /** 저장에 성공하면 부른다(폼은 부른 쪽이 닫는다) */
  onSaved: (saved: GuideSaved) => void;
};

/** 위치만 고르기 — ① 만 열고 「이 위치로 선택」 에서 고른 위치를 돌려준다(숙소 주소). 저장은 없다 */
export type LocationMode = {
  kind: "location";
  /** 이미 고른 위치(다시 고를 때). 없으면 비어서 시작한다 */
  initial: PickedLocation | null;
  title: string;
  /** 골랐다(폼은 부른 쪽이 닫는다) */
  onPicked: (location: PickedLocation) => void;
};

/** 검색 범위 · 처음 지도 중심 · 현지어 주소 · 「도쿄 장소」 안내의 도시. 없으면 제한 없이 찾고 고르기 전엔 지도가 없다 */
export type FormCity = (SearchCity & { name: string }) | null;

/** 모드별 본문이 받는 것 — 창(PlaceFormDialog)이 넘긴다 */
export type BodyProps<M> = {
  tripId: string;
  city: FormCity;
  mode: M;
  onClose: () => void;
  /** 저장 중 잠금을 창에 알린다(useReportLock) */
  onLockChange: (locked: boolean) => void;
};
