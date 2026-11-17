import { CATEGORY_LABEL, type CrewMember, PassChip } from "@/entities/schedule-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { VisitMediaList } from "@/widgets/visit-media";

import type { BlockRating, Entry } from "../lib/travelogue";

type EntryRowProps = {
  tripId: string;
  entry: Entry;
  /** 올린 사람 — 혼자 여행이면 null(아바타 · 「○○님 사진」 을 그리지 않는다) */
  uploader: (userId: string | null) => CrewMember | null;
  /** 일행이 있는 여행 — 별점 줄에 사람마다 아바타 + 별점 */
  shared: boolean;
};

/** 여행기의 한 줄 — 장소 블록 · 기록 없이 다녀온 곳 한 줄 · 패스 회색 줄 · 이동 */
export function EntryRow({ tripId, entry, uploader, shared }: EntryRowProps) {
  if (entry.type === "move") {
    return (
      <div className="flex items-center gap-3 px-5 py-4 text-xs text-route-label-sub">
        <span className="h-px flex-1 bg-line-card" />
        {entry.label}
        <span className="h-px flex-1 bg-line-card" />
      </div>
    );
  }
  if (entry.type === "pass") {
    return (
      <div className="mx-5 flex h-9 items-center gap-1.5 rounded-memo bg-pass-bg px-3">
        <Time time={entry.time} />
        {entry.emoji && (
          <span className="shrink-0 text-sm opacity-75 grayscale">{entry.emoji}</span>
        )}
        <span className="truncate text-sm font-bold text-pass-text">{entry.name}</span>
        <span className="ml-auto shrink-0">
          <PassChip />
        </span>
      </div>
    );
  }
  if (entry.plain) {
    return (
      <p className="flex min-w-0 items-baseline gap-1.5 px-5 text-[13px] text-route-walk-text">
        <Time time={entry.time} />
        <span className="truncate font-bold">
          {entry.emoji && `${entry.emoji} `}
          {entry.name}
        </span>
      </p>
    );
  }
  return (
    <article className="flex flex-col gap-2.5 px-5">
      <p className="text-xs font-bold text-route-card-meta">
        {[entry.time, entry.category && CATEGORY_LABEL[entry.category]].filter(Boolean).join(" · ")}
      </p>
      <h3 className="text-[19px] font-extrabold tracking-[-0.01em] text-ink-900">
        {entry.emoji && `${entry.emoji} `}
        {entry.name}
      </h3>
      {entry.rating && <RatingLine rating={entry.rating} shared={shared} />}
      {entry.note && (
        <p className="text-base/[1.75] whitespace-pre-wrap text-[#333]">{entry.note}</p>
      )}
      {entry.photos.length > 0 && (
        <div className="pt-1">
          <VisitMediaList tripId={tripId} photos={entry.photos} uploader={uploader} />
        </div>
      )}
    </article>
  );
}

type TimeProps = { time: string | null };

/** 줄 앞의 시각(없으면 없다) */
function Time({ time }: TimeProps) {
  if (!time) return null;
  return <span className="shrink-0 text-[13px] text-route-card-meta tabular-nums">{time}</span>;
}

type RatingLineProps = { rating: BlockRating; shared: boolean };

/** 별점 줄 — 「★ 4.5」 14/800 + 일행이면 사람마다 아바타 18 + 「★5」 */
function RatingLine({ rating, shared }: RatingLineProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <span className="text-sm font-extrabold text-ink-900">
        <span className="text-my-star">★</span> {rating.average}
      </span>
      {shared &&
        rating.people.map((p) => (
          <span key={p.id} className="flex items-center gap-1 text-xs text-route-sub">
            <Avatar className="size-4.5">
              <AvatarImage src={p.avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="text-[9px]">{p.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            ★{p.stars}
          </span>
        ))}
    </div>
  );
}
