import type { ReservationStatus } from "@/entities/schedule-item";
import { type Stay, type StayFieldsInput, stayLinksOf, type StayPlaceInput } from "@/entities/stay";
import type { PickedLocation } from "@/shared/lib/google-places";
import { isTimeValue } from "@/shared/lib/time-input";
import type { LinkDraft } from "@/shared/ui/link-rows";

/** 기본 아이콘 · 체크인 / 체크아웃 시각(시안) */
export const STAY_DEFAULT_EMOJI = "🏨";
const DEFAULT_IN_TIME = "15:00";
const DEFAULT_OUT_TIME = "11:00";

/** 숙소 입력 폼의 값 — 입력 칸이 다루는 문자열 그대로. 저장할 때 toStayPayload 로 바꾼다 */
export type StayFormValues = {
  status: ReservationStatus | null;
  /** ""(빈 글) = 기본 🏨 */
  emoji: string;
  name: string;
  /** 지도에서 고른 위치. 정해야 저장할 수 있다 */
  location: PickedLocation | null;
  checkIn: string | null;
  checkOut: string | null;
  /** 「HH:MM」 또는 ""(시간 없음) */
  inTime: string;
  outTime: string;
  memo: string;
  links: LinkDraft[];
};

/** 새 숙소 — 상태 없음 · 날짜 없음 · 시각은 기본값 */
export function blankStayForm(): StayFormValues {
  return {
    status: null,
    emoji: "",
    name: "",
    location: null,
    checkIn: null,
    checkOut: null,
    inTime: DEFAULT_IN_TIME,
    outTime: DEFAULT_OUT_TIME,
    memo: "",
    links: [],
  };
}

/** 저장된 숙소를 폼 값으로. 위치는 장소에서 가져온다(좌표가 없는 옛 장소면 비워 다시 고르게) */
export function stayFormFrom(stay: Stay): StayFormValues {
  const p = stay.place;
  return {
    status: (stay.status as ReservationStatus | null) ?? null,
    emoji: stay.emoji ?? "",
    name: p.name,
    location:
      p.lat !== null && p.lng !== null
        ? {
            lat: p.lat,
            lng: p.lng,
            googlePlaceId: p.google_place_id,
            name: p.name,
            address: p.address,
            addressLocal: p.address_local,
            addressKo: p.address_ko,
            gmapUrl: p.gmap_url ?? "",
          }
        : null,
    checkIn: stay.check_in_date,
    checkOut: stay.check_out_date,
    inTime: stay.check_in_time?.slice(0, 5) ?? "",
    outTime: stay.check_out_time?.slice(0, 5) ?? "",
    memo: stay.memo ?? "",
    links: stayLinksOf(stay.links),
  };
}

export type StayPayload =
  { ok: true; place: StayPlaceInput; fields: StayFieldsInput } | { ok: false; error: string };

/** http(s) 링크인지 */
const isHttp = (url: string) => /^https?:\/\//i.test(url);

/** 저장 전에 사용자가 고칠 수 있는 첫 문제. 없으면 null */
function problemOf(v: StayFormValues): string | null {
  if (!v.location) return "주소를 정해 주세요";
  if (!v.name.trim()) return "숙소 이름을 입력해 주세요";
  if (!v.checkIn || !v.checkOut) return "숙박 날짜를 골라 주세요";
  if ((v.inTime && !isTimeValue(v.inTime)) || (v.outTime && !isTimeValue(v.outTime))) {
    return "시간을 00:00 ~ 23:59 사이로 입력해 주세요";
  }
  const bad = v.links.find((l) => l.url.trim() && !isHttp(l.url.trim()));
  return bad ? "링크 주소는 http:// 나 https:// 로 시작해야 해요" : null;
}

/** 폼 값을 save_stay 에 보낼 모양으로. 빈 링크 줄은 버린다 */
export function toStayPayload(v: StayFormValues): StayPayload {
  const problem = problemOf(v);
  if (problem || !v.location || !v.checkIn || !v.checkOut) {
    return { ok: false, error: problem ?? "입력을 확인해 주세요" };
  }
  const loc = v.location;
  return {
    ok: true,
    place: {
      name: v.name.trim().slice(0, 100),
      lat: loc.lat,
      lng: loc.lng,
      address: loc.address,
      address_local: loc.addressLocal,
      address_ko: loc.addressKo,
      google_place_id: loc.googlePlaceId,
      gmap_url: loc.gmapUrl || null,
    },
    fields: {
      // 비우면 기본 🏨 을 저장한다 — 연결 카드에도 같은 아이콘이 보이게
      emoji: v.emoji.trim() || STAY_DEFAULT_EMOJI,
      status: v.status,
      check_in_date: v.checkIn,
      check_out_date: v.checkOut,
      check_in_time: v.inTime || null,
      check_out_time: v.outTime || null,
      memo: v.memo.trim() || null,
      links: v.links
        .map((l) => ({ title: l.title.trim(), url: l.url.trim() }))
        .filter((l) => l.url),
    },
  };
}

/** 숙박 날짜가 저장된 것과 다른지 — 다르면 연결 카드가 다시 계산된다 */
export function datesChanged(v: StayFormValues, stay: Stay): boolean {
  return v.checkIn !== stay.check_in_date || v.checkOut !== stay.check_out_date;
}

/** 위치를 골랐을 때 이름 채우기 — 비어 있거나 앞서 고른 구글 장소 이름 그대로면 새 장소 이름으로 */
export function nameAfterPick(v: StayFormValues, picked: PickedLocation): string {
  const untouched = v.name.trim() === "" || v.name === v.location?.name;
  return untouched && picked.name ? picked.name : v.name;
}
