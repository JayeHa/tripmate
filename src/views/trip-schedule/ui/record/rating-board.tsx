import { ratingText } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

import type { BoardPerson, RatingBoard as Board } from "../../lib/crew";

type RatingBoardProps = { board: Board };

/**
 * 기록 자세히 보기의 별점 박스 — 머리 「별점 · 각자 매겨요」 + 오른쪽 「★ 4.5 · 2명」(매긴 사람이 있을 때), 사람마다 한 줄.
 * 별점은 각자 매기는 값이라 여기서는 보기만 한다(내 것은 카드 · 기록 창에서 바꾼다)
 */
export function RatingBoard({ board }: RatingBoardProps) {
  return (
    <section
      aria-label="별점"
      className="flex flex-col gap-2.5 rounded-card bg-surface-sunken px-3.5 py-3 lg:px-4 lg:py-3.5"
    >
      <div className="flex items-baseline gap-1.5">
        <span className="text-[13px] font-extrabold text-ink-900">별점</span>
        <span className="text-xs text-route-card-meta">각자 매겨요</span>
        {board.average !== null && (
          <span className="ml-auto text-[13px] font-extrabold text-ink-900 tabular-nums">
            <span className="text-my-star">★</span> {board.average} · {board.count}명
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-2.5">
        {board.people.map((p) => (
          <BoardRow key={p.id} person={p} />
        ))}
      </ul>
    </section>
  );
}

type BoardRowProps = { person: BoardPerson };

/** 한 사람 — 아바타 24 · 이름(나는 「(나)」) · 별 다섯 + 문구, 안 매겼으면 「아직 안 매겼어요」 */
function BoardRow({ person }: BoardRowProps) {
  return (
    <li className="flex items-center gap-2">
      <Avatar size="sm">
        <AvatarImage src={person.avatarUrl ?? undefined} alt="" />
        <AvatarFallback>{person.name.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-1 items-baseline gap-1 text-sm font-bold text-ink-900">
        <span className="truncate">{person.name}</span>
        {person.me && <span className="shrink-0 font-medium text-route-card-meta">(나)</span>}
      </span>
      {person.stars === null ? (
        <span className="shrink-0 text-xs text-route-label-sub">아직 안 매겼어요</span>
      ) : (
        <>
          <Stars stars={person.stars} className="shrink-0 text-base" />
          <span className="w-15.5 shrink-0 text-right text-xs font-extrabold text-my-star-text">
            {ratingText(person.stars)}
          </span>
        </>
      )}
    </li>
  );
}

type StarsProps = { stars: number; className?: string };

/** 별 다섯 — 매긴 만큼 노랑, 나머지는 회색. 크기는 쓰는 곳이 글자 크기로 정한다 */
export function Stars({ stars, className }: StarsProps) {
  return (
    <span
      role="img"
      aria-label={`별 ${stars}개`}
      className={cn("leading-none tracking-[1px] text-my-star", className)}
    >
      {"★".repeat(stars)}
      <span className="text-my-star-empty">{"★".repeat(5 - stars)}</span>
    </span>
  );
}
