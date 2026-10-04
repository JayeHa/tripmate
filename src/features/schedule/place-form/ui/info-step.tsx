import { Info, MapPin } from "lucide-react";

import { CATEGORY_LABEL, PLACE_CATEGORIES } from "@/entities/schedule-item";

import type { PlaceFormState } from "../model/use-place-fields";
import { AddressCard } from "./address-card";
import { ChipButton, Field, inputClass, LinkListField } from "./form-parts";
import { HoursField } from "./hours-field";

/** 장소 폼에서 고르는 카테고리. 공항 · 교통은 담을 장소가 아니라 뺀다 */
const CATEGORIES = PLACE_CATEGORIES.filter((c) => c !== "air");

type InfoStepProps = {
  form: PlaceFormState;
  /** 「도쿄 장소 · 모든 도쿄 여행에서 같이 보여요」 의 도시 이름. 없으면 안내를 줄인다 */
  cityName: string | null;
  /**
   * 장소 정보 수정이면 true — 맨 위 주황 안내(모든 일정에 반영), 아이콘 칸 · 아래 담기 안내를 뺀다.
   * 아이콘은 일정마다 따로라 「이번 일정 · 수정」 에서 바꾼다
   */
  editing?: boolean;
};

/**
 * ② 장소 정보 — 다음 여행에서도 맞는 정보(장소 테이블). 위치(① 에서 고른 주소 + 상세 위치) · 이름 · 카테고리 ·
 * 운영시간 · 별점 · 리뷰 수 · 대기 · 설명 · 구글맵 · 장소 링크. 새로 담을 때는 이름 옆에 담을 일정의 아이콘도 받는다.
 */
export function InfoStep({ form, cityName, editing = false }: InfoStepProps) {
  const { values: v, set } = form;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5.5 overflow-y-auto px-5 pt-4.5 pb-6">
      {editing && (
        <p className="flex items-start gap-2 rounded-card bg-status-wait-bg px-3.5 py-3 text-[13px]/relaxed font-semibold text-status-wait">
          <Info className="mt-0.5 size-4 shrink-0" />이 장소를 쓰는 모든 일정과 홈 가이드에 같이
          반영돼요.
        </p>
      )}
      <div className="flex flex-col gap-1">
        <span className="text-[17px] font-extrabold text-ink-900">장소 정보</span>
        <span className="text-[13px]/normal text-ink-400">
          {cityName
            ? `${cityName} 장소 · 모든 ${cityName} 여행에서 같이 보여요`
            : "다른 일정 · 여행에서도 같이 보여요"}
        </span>
      </div>
      <Field label="위치">
        <AddressCard
          found={form.found}
          action={{ label: "위치 변경", onClick: form.changeLocation }}
        />
        <input
          value={v.addressDetail}
          onChange={(e) => set("addressDetail", e.target.value)}
          maxLength={100}
          placeholder="상세 위치 (선택) · 예: 파르코 본관 8F"
          aria-label="상세 위치"
          className={inputClass}
        />
      </Field>
      <Field label="장소 이름">
        <div className={editing ? "grid" : "grid grid-cols-[52px_minmax(0,1fr)] gap-2"}>
          {!editing && (
            <input
              value={v.emoji}
              onChange={(e) => set("emoji", e.target.value.trim())}
              maxLength={8}
              placeholder="🙂"
              aria-label="아이콘"
              className={`${inputClass} px-0 text-center text-[22px]`}
            />
          )}
          <input
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={100}
            placeholder="장소 이름"
            aria-label="장소 이름"
            className={inputClass}
          />
        </div>
      </Field>
      <Field label="카테고리" optional>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <ChipButton
              key={c}
              on={v.category === c}
              onClick={() => set("category", v.category === c ? null : c)}
            >
              {CATEGORY_LABEL[c]}
            </ChipButton>
          ))}
        </div>
      </Field>
      <HoursField form={form} />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] gap-2.5">
        <Field label="별점">
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 text-sm text-star">★</span>
            <input
              value={v.rating}
              onChange={(e) => form.setRating(e.target.value)}
              inputMode="decimal"
              placeholder="4.5"
              aria-label="별점"
              className={`${inputClass} pl-7.5`}
            />
          </div>
        </Field>
        <Field label="리뷰 수">
          <input
            value={v.reviews}
            onChange={(e) => form.setReviews(e.target.value)}
            inputMode="numeric"
            placeholder="1,355"
            aria-label="리뷰 수"
            className={`${inputClass} px-2.5`}
          />
        </Field>
        <Field label="예상 대기">
          <input
            value={v.wait}
            onChange={(e) => set("wait", e.target.value)}
            maxLength={30}
            placeholder="예) 40분"
            aria-label="예상 대기"
            className={`${inputClass} px-2.5`}
          />
        </Field>
      </div>
      <Field label="설명" optional>
        <textarea
          value={v.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          placeholder="예) 에도마에 텐동 · 파르코 7F · 오전이 한산해요"
          className="w-full resize-none rounded-card border border-line px-3.5 py-3 text-[15px]/relaxed text-ink-900 outline-none focus:border-primary"
        />
      </Field>
      <Field label="구글맵 링크" optional>
        <div className="relative flex items-center">
          <MapPin className="pointer-events-none absolute left-3.5 size-4.5 text-ink-400" />
          <input
            value={v.gmap}
            onChange={(e) => set("gmap", e.target.value)}
            inputMode="url"
            placeholder="https://maps.app.goo.gl/…"
            aria-label="구글맵 링크"
            className={`${inputClass} pl-10`}
          />
        </div>
      </Field>
      <LinkListField
        label="장소 링크"
        titlePlaceholder="링크 제목 (예: 공식 홈페이지, 메뉴판)"
        links={v.links}
        onChange={(links) => set("links", links)}
      />
      {!editing && (
        <p className="flex items-start gap-2 rounded-card bg-surface-memo px-3.5 py-3 text-[13px]/relaxed text-status-ok">
          <Info className="mt-0.5 size-4 shrink-0" />
          장소가 저장되고 일정에 담겨요. 시간 · 예약 상태 · 메모는 담은 뒤 일정 상세에서 입력해요.
        </p>
      )}
    </div>
  );
}
