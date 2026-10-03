import { ArrowUpRight } from "lucide-react";

import type { Alternative } from "../../model/place";

type AlternativesLineProps = { alternatives: Alternative[] };

/** 「또는 ○○ ↗」. 둘 이상이면 개수만 보이고, 바꾸기는 장소 상세에서 한다 */
export function AlternativesLine({ alternatives }: AlternativesLineProps) {
  if (alternatives.length === 0) return null;
  const [first] = alternatives;
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] leading-normal">
      <span className="font-bold text-ink-700">또는</span>
      {alternatives.length === 1 ? (
        <a
          href={first.gmap}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-bold text-primary"
        >
          {first.name}
          <ArrowUpRight className="size-3.25" strokeWidth={2.2} />
        </a>
      ) : (
        <span className="font-bold text-primary">대체 장소 {alternatives.length}곳</span>
      )}
    </div>
  );
}
