import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

import type { CrewPerson, CrewRating } from "../../lib/crew";

type CrewRatingRowProps = CrewRating;

/**
 * 다녀온 카드 별점 줄 아래 「일행」 — 사람마다 아바타 20 + 「★ 4」, 안 매긴 사람은 흐린 아바타 + 「아직」.
 * PC 는 이름도 함께. 줄이면 끝에 「+2」, 매긴 사람이 2명 이상이면 오른쪽 끝 「평균 4.5」.
 * 별점은 각자 매기고 일행 것은 보기만 한다
 */
export function CrewRatingRow({ people, more, average }: CrewRatingRowProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="w-15.5 shrink-0 self-start pt-0.5 text-xs font-bold text-route-walk-text">
        일행
      </span>
      <ul className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 lg:gap-x-3">
        {people.map((p) => (
          <CrewChip key={p.id} person={p} />
        ))}
        {more > 0 && <li className="text-xs font-bold text-route-card-meta">+{more}</li>}
      </ul>
      {average !== null && (
        <span className="shrink-0 self-start pt-0.5 text-xs font-bold text-route-card-meta tabular-nums">
          평균 {average}
        </span>
      )}
    </div>
  );
}

type CrewChipProps = { person: CrewPerson };

/** 한 사람 — 아바타 · (PC) 이름 · 「★ 4」 또는 「아직」 */
function CrewChip({ person }: CrewChipProps) {
  const rated = person.stars !== null;
  return (
    <li
      className="flex min-w-0 items-center gap-1"
      aria-label={`${person.name} ${rated ? `별점 ${person.stars}` : "아직 안 매김"}`}
    >
      <Avatar className={cn("size-5", !rated && "opacity-50")}>
        <AvatarImage src={person.avatarUrl ?? undefined} alt="" />
        <AvatarFallback>{person.name.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <span className="hidden max-w-20 truncate text-xs font-bold text-ink-700 lg:inline">
        {person.name}
      </span>
      {rated ? (
        <span className="text-xs font-extrabold text-my-star-text tabular-nums">
          ★ {person.stars}
        </span>
      ) : (
        <span className="text-xs text-route-label-sub">아직</span>
      )}
    </li>
  );
}
