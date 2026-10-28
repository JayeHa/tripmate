import { ChevronRight, CircleCheck, Users } from "lucide-react";

import { PersonAvatar, type PersonRef } from "@/entities/expense";

import type { SettleRest } from "../../lib/settle-card";

type MorePeopleProps = {
  people: { person: PersonRef; name: string; url: string | null }[];
  onClick: () => void;
};

/** 「외 3명 · 서연 · 민수 · 지호」 — 겹친 아바타 22(흰 2px 링, 3명까지) · 13/600 회색 · › */
export function MorePeople({ people, onClick }: MorePeopleProps) {
  return (
    <button type="button" onClick={onClick} className="flex h-8.5 items-center gap-2 text-left">
      <span className="flex shrink-0 pl-1.5">
        {people.slice(0, 3).map((p) => (
          <PersonAvatar
            key={`${p.person.kind}:${p.person.id}`}
            guest={p.person.kind === "guest"}
            name={p.name}
            url={p.url}
            className="-ml-1.5 size-5.5 ring-2 ring-white"
          />
        ))}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-400">
        외 {people.length}명 · {people.map((p) => p.name).join(" · ")}
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-line-dashed" />
    </button>
  );
}

type RestLineProps = { rest: NonNullable<SettleRest>; onClick: () => void };

/** 보이지 않은 송금 — 회색 줄 36 · r8. 내 정산이 끝났으면 ✓, 아니면 사람 아이콘 */
export function RestLine({ rest, onClick }: RestLineProps) {
  const Icon = rest.mineDone ? CircleCheck : Users;
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 flex h-9 items-center gap-2 rounded-button bg-surface-sunken px-2.5 text-left"
    >
      <Icon aria-hidden="true" className="size-3.75 shrink-0 text-ink-400" />
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-500">
        {rest.text}
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-line-dashed" />
    </button>
  );
}

type NoTransfersProps = { text: string };

/** 남은 송금 없음 — ✓ 16 + 13 회색 한 줄 */
export function NoTransfers({ text }: NoTransfersProps) {
  return (
    <p className="flex items-center gap-2 py-1 text-[13px] text-ink-400">
      <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
      {text}
    </p>
  );
}
