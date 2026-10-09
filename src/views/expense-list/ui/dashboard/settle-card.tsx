import { ChevronRight } from "lucide-react";

import { type PersonKey, personKey, type PersonRef } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

import { settleCardView } from "../../lib/settle-card";
import type { Dashboard } from "../../model/use-dashboard";
import { MorePeople, NoTransfers, RestLine } from "./settle-card-parts";
import { SettlePersonRow } from "./settle-person-row";
import { TransferLine } from "./transfer-line";

/** 크기 — 모바일 대시보드 / PC 오른쪽 카드 */
const SIZE = {
  md: { title: "text-[15px]" },
  sm: { title: "text-sm" },
} as const;

type SettleCardProps = {
  settle: NonNullable<Dashboard["settle"]>;
  home: string;
  /** 표시 이름 · 사진 */
  avatarOf: (person: PersonRef) => { name: string; url: string | null };
  /** 정산 상세를 연다 — 사람 줄은 그 사람, 「자세히 보기」 · 「외 N명」 · 「외 N건」 은 null(나부터) */
  onOpen: (person: PersonKey | null) => void;
  size?: keyof typeof SIZE;
};

/**
 * 「정산」(P37 — 인원과 상관없이 높이가 멈추는 카드). 사람은 (나) + 차액 큰 순 2명까지(쓴 돈 · 결제한 돈), 넘치면 「외 N명」.
 * 점선 아래 「내 송금 N건」 — 나와 주고받는 남은 송금 2건까지(받을 것 먼저), 나머지는 회색 줄 하나. 보낸 송금은 보이지 않는다(상세에서).
 * 남은 송금이 없으면 「모두 정산됐어요」 · 「각자 낸 만큼 썼어요」 한 줄. 환율이 없는 비용이 있으면 계산하지 않고 그 통화를 알린다
 */
export function SettleCard({ settle, home, avatarOf, onOpen, size = "md" }: SettleCardProps) {
  const s = SIZE[size];
  const pc = size === "sm";
  return (
    <>
      <div className="flex items-center">
        <h2 className={cn("flex-1 font-extrabold text-ink-900", s.title)}>정산</h2>
        <button
          type="button"
          onClick={() => onOpen(null)}
          className="flex items-center gap-px text-[13px] font-bold whitespace-nowrap text-brand-text"
        >
          자세히 보기
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </button>
      </div>
      {settle.missing ? (
        <p className="text-[13px] text-ink-400">
          {settle.missing} 환율이 없어 정산을 계산하지 못했어요.
        </p>
      ) : (
        <SettleBody settle={settle} home={home} avatarOf={avatarOf} onOpen={onOpen} pc={pc} />
      )}
    </>
  );
}

type SettleBodyProps = Omit<SettleCardProps, "size"> & { pc: boolean };

/** 계산이 된 정산 — 사람 줄 · 「외 N명」 · 점선 아래 내 송금과 나머지 */
function SettleBody({ settle, home, avatarOf, onOpen, pc }: SettleBodyProps) {
  const v = settleCardView(settle.people, settle.remaining, settle.me, settle.sent.length > 0);
  const named = (person: PersonRef) => ({ person, ...avatarOf(person) });
  return (
    <>
      <p className="-mt-1.5 text-right text-[11px] text-ink-350">쓴 돈 · 결제한 돈</p>
      {v.shown.map(({ person, spent, paid }) => {
        const a = avatarOf(person);
        return (
          <SettlePersonRow
            key={personKey(person)}
            person={person}
            name={a.name}
            url={a.url}
            me={personKey(person) === settle.me}
            spent={spent}
            paid={paid}
            home={home}
            compact={pc}
            onClick={() => onOpen(personKey(person))}
          />
        );
      })}
      {v.hidden.length > 0 && (
        <MorePeople people={v.hidden.map((p) => named(p.person))} onClick={() => onOpen(null)} />
      )}
      <div className="flex flex-col gap-0.5 border-t border-dashed border-line pt-2.5">
        {v.mineCount > 0 && (
          <span className="pb-0.5 text-xs font-bold text-ink-400">내 송금 {v.mineCount}건</span>
        )}
        {v.mine.map((t) => (
          <TransferLine
            key={`${t.from}>${t.to}`}
            from={t.from}
            to={t.to}
            amount={formatMoney(t.amount, home)}
            done={false}
            avatarOf={avatarOf}
            pc={pc}
            tone={t.to === settle.me ? "receive" : "send"}
          />
        ))}
        {v.rest && <RestLine rest={v.rest} onClick={() => onOpen(null)} />}
        {v.none && <NoTransfers text={v.none} />}
      </div>
    </>
  );
}
