import { ArrowUpRight } from "lucide-react";

import type { Alternative } from "@/entities/schedule-item";

type AlternativesBlockProps = { alternatives: Alternative[] };

/**
 * 대체 장소 — 이 일정이 안 될 때 갈 곳. 이름(구글맵 ↗) · 한 줄 설명. 없으면 그리지 않는다.
 * 「바꾸기」 · 지우기 · 「+ 대체 장소」 는 ③-c 에서 붙인다.
 */
export function AlternativesBlock({ alternatives }: AlternativesBlockProps) {
  if (alternatives.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-ink-400">대체 장소 {alternatives.length}</span>
      {alternatives.map((a) => (
        <div
          key={`${a.name}-${a.gmap}`}
          className="flex flex-col gap-0.5 rounded-card border border-line-card px-3.5 py-3"
        >
          <a
            href={a.gmap}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[15px] font-bold text-ink-900"
          >
            {a.name}
            <ArrowUpRight className="size-3.5 text-primary" />
          </a>
          {a.sub && <span className="text-[13px] text-ink-500">{a.sub}</span>}
        </div>
      ))}
    </section>
  );
}
