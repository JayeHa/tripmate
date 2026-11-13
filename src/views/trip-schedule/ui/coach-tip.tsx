"use client";

import type { WheelEvent } from "react";
import { createPortal } from "react-dom";

import type { DayMode } from "@/entities/schedule-item";
import { useMediaQuery } from "@/shared/lib/use-media-query";
import { cn } from "@/shared/lib/utils";

import type { TipId } from "../lib/coach";
import { COACH_LAYER, type CoachSpot, useCoachSpot } from "../model/use-coach-spot";
import { type RouteCoach, useRouteCoach } from "../model/use-route-coach";

const COPY: Record<TipId, { title: string; body: string }> = {
  mode: {
    title: "계획 ↔ 기록",
    body: "여행 중엔 「기록」으로 바꿔서 다녀온 곳에 별점 · 글 · 사진을 남겨요.",
  },
  map: {
    title: "하루 동선은 지도로",
    body: "그날 장소를 순서대로 지도에서 봐요. 카드를 넘기면 핀도 같이 움직여요.",
  },
  visit: {
    title: "다녀온 곳은 체크, 못 간 곳은 패스",
    body: "계획 · 기록 어디서든 바꿀 수 있고, 다시 누르면 취소돼요.",
  },
};

/** 아래 줄 — 왼쪽 단계 글자와 오른쪽 버튼. 모바일의 처음 두 개만 이어지는 단계다 */
const LAST = { step: "", cta: "알겠어요" };
const MOBILE_STEPS: Partial<Record<TipId, typeof LAST>> = {
  mode: { step: "1 / 2", cta: "다음" },
  map: { step: "2 / 2", cta: "알겠어요" },
};

/** 버튼과 말풍선 사이(px) */
const GAP = 12;
/** 펼친 카드의 토글 줄 — 상자 모양이 아니라 테두리를 두르지 않고, 말풍선을 줄 위 끝에 붙여 꼬리가 버튼 가까이 닿게 한다 */
const ROW = "visit-row";
const ROW_GAP = -2;

/** 말풍선의 자리(화면 px) · 그 자리에서 옮길 방향 · 꼬리 자리 */
type Place = { top: number; left: number; shift: string; tail: string };

/**
 * 말풍선을 둘 자리 — 다녀왔어요 · 패스는 버튼 줄 위(오른쪽 끝 맞춤), 나머지는 버튼 아래.
 * 아래에 둘 때는 오른쪽 끝을 맞추고(4 밖으로), PC 의 「계획 | 기록」 은 화면 왼쪽 끝 레일에 있어 왼쪽 끝을 맞춘다
 */
function placeOf(tip: TipId, mobile: boolean, spot: CoachSpot): Place {
  const right = spot.left + spot.width;
  if (tip === "visit") {
    const top = spot.top - (spot.kind === ROW ? ROW_GAP : GAP);
    return {
      top,
      left: right,
      shift: "-translate-x-full -translate-y-full",
      tail: "right-15 -bottom-1.25",
    };
  }
  const top = spot.top + spot.height + GAP;
  if (tip === "mode" && !mobile)
    return { top, left: spot.left - 4, shift: "", tail: "-top-1.25 left-8.5" };
  return { top, left: right + 4, shift: "-translate-x-full", tail: "-top-1.25 right-8.5" };
}

type RouteCoachTipProps = {
  /** 일정이 비어 있지 않다 — 비었으면 띄우지 않는다 */
  ready: boolean;
  mode: DayMode;
  /** 펼친 카드 */
  openId: string | null;
};

/**
 * 일정 화면의 첫 사용 말풍선 — 띄울 것이 있을 때만 그린다. 일정 목록(모바일 · PC 공용)이 일정을 읽은 뒤에 둔다.
 * 순서(모바일은 「🗺 동선 보기」 까지 이어진다)는 화면 폭으로 정한다 — 레이아웃을 가르는 1024 와 같다
 */
export function RouteCoachTip({ ready, mode, openId }: RouteCoachTipProps) {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const coach = useRouteCoach({
    mobile: desktop === false,
    ready: ready && desktop !== null,
    mode,
    openId,
  });
  return coach && <CoachTip {...coach} />;
}

/** 세로로 스크롤되는 칸인지 */
function scrollsY(el: Element): boolean {
  return el.scrollHeight > el.clientHeight && /auto|scroll/.test(getComputedStyle(el).overflowY);
}

/**
 * 닫기 칸 위에서 굴린 휠을 그 아래의 스크롤 칸으로 넘긴다 — PC 목록은 창이 아니라 안쪽 칸이 스크롤돼서,
 * 화면을 덮은 닫기 칸이 휠을 막으면 말풍선이 떠 있는 동안 목록이 멈춘 것처럼 보인다(창이 스크롤되는 모바일은 그대로 된다)
 */
function passWheel(e: WheelEvent<HTMLElement>) {
  const under = document
    .elementsFromPoint(e.clientX, e.clientY)
    .find((el) => el !== e.currentTarget);
  let el = under ?? null;
  while (el && !scrollsY(el)) el = el.parentElement;
  el?.scrollBy({ top: e.deltaY });
}

type CoachTipProps = RouteCoach;

/**
 * 말풍선 하나 — 가리키는 버튼에 파란 테두리(3px)를 두르고 검정 말풍선(폭 248 · PC 260)을 꼬리와 함께 붙인다.
 * body 에 그려서 붙는 줄 · 스크롤 칸에 잘리거나 깔리지 않고, 가리키는 요소의 화면 자리를 재서 따라간다(요소가 화면에 보이지 않으면 그리지 않는다).
 * 화면을 어둡게 덮지 않는다. 대신 화면 전체에 투명한 닫기 칸을 깔아 말풍선 밖을 누르면 닫히기만 하고 그 누름이 아래 버튼에 닿지 않는다.
 * 떠 있는 버튼 · PC 헤더(z 30)보다 위, 모바일 편집 화면(z 40) · 열린 창(z 50)보다 아래 — 편집 중이거나 창이 열려 있으면 가려진다
 */
function CoachTip({ tip, mobile, anchor, onNext, onClose }: CoachTipProps) {
  const spot = useCoachSpot(anchor);
  if (!spot) return null;
  const { title, body } = COPY[tip];
  const { step, cta } = (mobile ? MOBILE_STEPS[tip] : undefined) ?? LAST;
  const place = placeOf(tip, mobile, spot);
  return createPortal(
    <>
      <button
        type="button"
        aria-label="안내 닫기"
        onClick={onClose}
        onWheel={passWheel}
        className="fixed inset-0 z-35 cursor-default"
        {...{ [COACH_LAYER]: "" }}
      />
      {spot.kind !== ROW && (
        <span
          aria-hidden
          className="pointer-events-none fixed z-35 ring-3 ring-brand/45"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            borderRadius: spot.radius,
          }}
        />
      )}
      <div
        className={cn(
          "fixed z-36 flex w-62 flex-col gap-1.5 rounded-card bg-[#111] px-3.5 py-3 text-left text-white shadow-[0_8px_24px_rgb(0_0_0/0.25)] lg:w-65",
          place.shift,
        )}
        style={{ top: place.top, left: place.left }}
        {...{ [COACH_LAYER]: "" }}
      >
        <span className="text-sm/[1.45] font-bold">{title}</span>
        <span className="text-xs/normal font-medium text-on-dark-muted">{body}</span>
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[11px] font-semibold text-route-sub">{step}</span>
          <button
            type="button"
            onClick={onNext}
            className="text-[13px] font-extrabold text-[#7DB4FF]"
          >
            {cta}
          </button>
        </div>
        <span aria-hidden className={cn("absolute size-3 rotate-45 bg-[#111]", place.tail)} />
      </div>
    </>,
    document.body,
  );
}
