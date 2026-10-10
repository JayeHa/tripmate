"use client";

import { coordsMapsUrl, type PickedLocation, type SearchCity } from "@/shared/lib/google-places";

import { googleMapsUrl } from "../lib/google-autofill";
import { blankPlaceForm } from "../lib/place-form";
import { type PlaceFormState, usePlaceFields } from "./use-place-fields";

type LocationPickOptions = {
  tripId: string;
  city: SearchCity | null;
  /** 이미 고른 위치(숙소 주소를 다시 고를 때). 없으면 비어서 시작한다 */
  initial: PickedLocation | null;
  /** 「이 위치로 선택」 — 받은 쪽이 닫는다 */
  onPicked: (location: PickedLocation) => void;
};

/**
 * 위치만 고르기 — 장소 입력 폼의 ① 위치 선택만 쓰고, 「이 위치로 선택」 에서 ② 로 가는 대신 고른 위치를 돌려준다(숙소 주소).
 * 이미 있는 장소인지는 묻지 않는다(장소는 받는 쪽이 정한다). 저장은 없다
 */
export function useLocationPick({
  tripId,
  city,
  initial,
  onPicked,
}: LocationPickOptions): PlaceFormState {
  const at = initial ? { lat: initial.lat, lng: initial.lng } : null;
  const fields = usePlaceFields({
    tripId,
    city,
    initialValues: initial
      ? {
          ...blankPlaceForm(at),
          name: initial.name,
          googleId: initial.googlePlaceId,
          auto: { name: initial.name, category: null, gmap: initial.gmapUrl },
          gmap: initial.gmapUrl,
        }
      : blankPlaceForm(null),
    initialStep: "location",
    initialQuery: "",
    stored: initial
      ? {
          at,
          found: {
            address: initial.address,
            addressLocal: initial.addressLocal,
            addressKo: initial.addressKo,
          },
        }
      : null,
    findExisting: false,
  });
  const { values, found } = fields;
  return {
    ...fields,
    existing: null,
    /** 「이 위치로 선택」 — 핀 위치 · 고른 구글 장소 · 불러온 주소를 돌려준다 */
    chooseLocation: () => {
      if (!values.at) return;
      const id = values.googleId;
      onPicked({
        lat: values.at.lat,
        lng: values.at.lng,
        googlePlaceId: id,
        name: id ? values.name : "",
        address: found.address,
        addressLocal: found.addressLocal,
        addressKo: found.addressKo,
        gmapUrl: id ? googleMapsUrl(values.name, id) : coordsMapsUrl(values.at.lat, values.at.lng),
      });
    },
    save: () => undefined,
    saving: false,
    locked: false,
  };
}
