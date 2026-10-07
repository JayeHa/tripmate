"use client";

import { ChevronRight, CircleCheck } from "lucide-react";
import { useState } from "react";

import { type PersonKey, personKey, type PersonRef } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

import { transferRows } from "../../lib/dashboard";
import type { Dashboard } from "../../model/use-dashboard";
import { PersonAvatar } from "./person-avatar";
import { MoreTransfers, TransferLine } from "./transfer-line";

/** 크기 — 모바일 대시보드 / PC 오른쪽 카드 */
const SIZE = {
  md: { title: "text-[15px]", avatar: "size-7.5", name: "text-sm", spent: "text-[15px]" },
  sm: { title: "text-sm", avatar: "size-7", name: "text-[13px]", spent: "text-sm" },
} as const;

/** 처음 보이는 송금 줄 수 */
const SHOWN = 3;

type SettleCardProps = {
  settle: NonNullable<Dashboard["settle"]>;
  home: string;
  /** 표시 이름 · 사진 */
  avatarOf: (person: PersonRef) => { name: string; url: string | null };
  /** 정산 상세를 연다 — 사람 줄은 그 사람, 「자세히 보기」 · 「더 보기」 는 null(나부터) */
  onOpen: (person: PersonKey | null) => void;
  size?: keyof typeof SIZE;
};

/**
 * 「정산」 — 사람마다 쓴 돈(굵게) · 결제한 돈(작게), 점선 아래 송금(남은 것 먼저 · 보낸 것은 흐리게 긋고).
 * 송금이 3줄을 넘으면 모바일은 「+ N건 더 보기」 가 정산 화면으로, PC 는 그 자리에서 펼친다(PC 는 나와 주고받는 줄을 먼저).
 * 주고받을 송금이 없으면 「각자 낸 만큼 썼어요」. 환율이 없는 비용이 있으면 계산하지 않고 그 통화를 알린다
 */
export function SettleCard({ settle, home, avatarOf, onOpen, size = "md" }: SettleCardProps) {
  const s = SIZE[size];
  const pc = size === "sm";
  const [open, setOpen] = useState(false);
  const rows = transferRows(settle.remaining, settle.sent, settle.me, pc);
  const shown = open ? rows : rows.slice(0, SHOWN);
  const left = rows.filter((t) => !t.done).length;
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
        <>
          <p className="-mt-1.5 text-right text-[11px] text-ink-350">쓴 돈 · 결제한 돈</p>
          {settle.people.map(({ person, spent, paid }) => {
            const a = avatarOf(person);
            const me = personKey(person) === settle.me;
            return (
              <button
                type="button"
                key={personKey(person)}
                onClick={() => onOpen(personKey(person))}
                className="flex items-center gap-2.5 text-left"
              >
                <PersonAvatar person={person} name={a.name} url={a.url} className={s.avatar} />
                <span className={cn("min-w-0 flex-1 truncate font-semibold text-ink-700", s.name)}>
                  {a.name}
                  {me && " (나)"}
                </span>
                <span className="flex flex-col items-end gap-px">
                  <span className={cn("font-extrabold text-ink-900", s.spent)}>
                    {formatMoney(spent, home)}
                  </span>
                  <span className="text-[11px] text-ink-400">결제 {formatMoney(paid, home)}</span>
                </span>
              </button>
            );
          })}
          {rows.length === 0 ? (
            <p className="flex items-center gap-2 border-t border-dashed border-line pt-3 text-[13px] text-ink-400">
              <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
              각자 낸 만큼 썼어요 · 정산할 금액이 없어요
            </p>
          ) : (
            <div className="flex flex-col gap-0.5 border-t border-dashed border-line pt-2.5">
              <span className="pb-0.5 text-xs font-bold text-ink-400">남은 송금 {left}건</span>
              {shown.map((t) => (
                <TransferLine
                  key={t.key}
                  from={t.from}
                  to={t.to}
                  amount={formatMoney(t.amount, home)}
                  done={t.done}
                  avatarOf={avatarOf}
                  pc={pc}
                />
              ))}
              {rows.length > SHOWN && !open && (
                <MoreTransfers
                  count={rows.length - SHOWN}
                  onClick={() => (pc ? setOpen(true) : onOpen(null))}
                />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
