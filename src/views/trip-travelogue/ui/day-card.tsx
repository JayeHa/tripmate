import Link from "next/link";

import type { TravelogueDay } from "../lib/travelogue";
import { Collage } from "./collage";
import { DayDate } from "./day-date";

type DayCardProps = {
  tripId: string;
  startDate: string;
  day: TravelogueDay;
  /** 그날 읽기 주소 */
  href: string;
  holiday: string | null;
};

/**
 * 하루 카드(흰 · r18) — 콜라주 → 「DAY 1 · 10.31 (토)」 + 오른쪽 「4곳 · 📷 5 · 🎬 1」 → 제목 19/800 → 「베스트 ★4.5」 칩 + 장소
 * → 그날 글 첫 줄 둘(따옴표, 말줄임) → 「이 날 읽기 ›」. 누르면 그날 읽기. 아직 안 간 날은 흐리게 + 「아직 다녀오지 않은 날이에요」, 누를 수 없다
 */
export function DayCard({ tripId, startDate, day, href, holiday }: DayCardProps) {
  const body = <CardBody tripId={tripId} startDate={startDate} day={day} holiday={holiday} />;
  if (!day.open) {
    return (
      <div
        aria-disabled
        className="overflow-hidden rounded-[18px] bg-white opacity-50 lg:border lg:border-line-card"
      >
        {body}
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="overflow-hidden rounded-[18px] bg-white lg:border lg:border-line-card"
    >
      {body}
    </Link>
  );
}

type CardBodyProps = Omit<DayCardProps, "href">;

/** 하루 카드의 내용 */
function CardBody({ tripId, startDate, day, holiday }: CardBodyProps) {
  const counts = [
    `${day.places}곳`,
    day.photos > 0 && `📷 ${day.photos}`,
    day.videos > 0 && `🎬 ${day.videos}`,
  ].filter(Boolean);
  return (
    <>
      <Collage tripId={tripId} media={day.collage} />
      <div className="flex flex-col gap-2 px-4.5 pt-3.5 pb-4">
        <div className="flex items-center justify-between gap-2 text-xs font-bold">
          <span className="truncate text-route-card-meta">
            DAY {day.day + 1} · <DayDate startDate={startDate} day={day.day} holiday={holiday} />
          </span>
          {day.open && <span className="shrink-0 text-route-walk-text">{counts.join(" · ")}</span>}
        </div>
        {day.title && (
          <h3 className="text-[19px] font-extrabold tracking-[-0.01em] text-ink-900">
            {day.title}
          </h3>
        )}
        {day.best && (
          <p className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold text-ink-700">
            <span className="shrink-0 rounded-pill-sm bg-[#FFF7E0] px-1.5 py-0.5 text-xs font-extrabold text-my-star-text">
              베스트 ★{day.best.average}
            </span>
            <span className="truncate">{day.best.name}</span>
          </p>
        )}
        {day.lines.map((line) => (
          <p key={line.id} className="truncate text-[13px] text-route-walk-text">
            “{line.text}”
          </p>
        ))}
        {day.open ? (
          <span className="pt-0.5 text-[13px] font-extrabold text-action">이 날 읽기 ›</span>
        ) : (
          <span className="pt-0.5 text-[13px] text-route-card-meta">
            아직 다녀오지 않은 날이에요
          </span>
        )}
      </div>
    </>
  );
}
