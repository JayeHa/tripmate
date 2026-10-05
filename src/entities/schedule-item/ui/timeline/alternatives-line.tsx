import { ArrowUpRight } from "lucide-react";

import { isHttpUrl, itemName } from "../../model/place";
import type { ScheduleItem } from "../../model/types";

type AlternativesLineProps = { alternatives: ScheduleItem[] };

/**
 * 「또는 ○○ ↗」. 둘 이상이면 개수만 보이고, 바꾸기는 일정 상세에서 한다.
 * 하나일 때 그 장소의 구글맵 링크가 있으면 링크로, 없으면 이름만
 */
export function AlternativesLine({ alternatives }: AlternativesLineProps) {
  if (alternatives.length === 0) return null;
  const [first] = alternatives;
  const gmap = first.place?.gmap_url;
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px]/normal">
      <span className="font-bold text-ink-700">또는</span>
      {alternatives.length > 1 && (
        <span className="font-bold text-primary">대체 장소 {alternatives.length}곳</span>
      )}
      {alternatives.length === 1 && isHttpUrl(gmap) && (
        <a
          href={gmap}
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-flex items-center gap-0.5 font-bold text-primary"
        >
          {itemName(first)}
          <ArrowUpRight className="size-3.25" strokeWidth={2.2} />
        </a>
      )}
      {alternatives.length === 1 && !isHttpUrl(gmap) && (
        <span className="font-bold text-primary">{itemName(first)}</span>
      )}
    </div>
  );
}
