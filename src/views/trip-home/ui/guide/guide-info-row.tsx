import { List, Map as MapIcon, MapPin } from "lucide-react";

import { Segmented, type SegmentOption } from "@/shared/ui/segmented";

import type { GuideView } from "../../model/use-guide-view";

const VIEWS: SegmentOption<GuideView>[] = [
  { value: "list", label: "목록", icon: List },
  { value: "map", label: "지도", icon: MapIcon },
];

type GuideInfoRowProps = { view: GuideView; onView: (view: GuideView) => void };

/** 가이드 맨 위 줄 — 「이 여행의 장소 · …」 안내와 오른쪽 「목록 | 지도」 세그먼트(P18) */
export function GuideInfoRow({ view, onView }: GuideInfoRowProps) {
  return (
    <div className="flex items-center gap-2">
      <p className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-ink-400">
        <MapPin className="size-3.25 shrink-0" aria-hidden="true" />
        <span>
          <b className="font-bold text-ink-700">이 여행의 장소</b> · 일행과 함께 모아요. 일정에 넣은
          장소도 여기 남아요
        </span>
      </p>
      <Segmented
        options={VIEWS}
        value={view}
        onChange={onView}
        aria-label="가이드 보기"
        className="shrink-0"
      />
    </div>
  );
}
