"use client";

import { ChevronRight, CircleCheck } from "lucide-react";
import { useState } from "react";

import { type PersonKey, personKey, type PersonRef } from "@/entities/expense";
import { decimalsOf, formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

import { transferRows } from "../../lib/dashboard";
import { diffBars } from "../../lib/diff-bar";
import type { Dashboard } from "../../model/use-dashboard";
import { DiffRow } from "./diff-row";
import { MoreTransfers, TransferLine } from "./transfer-line";

/** 크기 — 모바일 대시보드 / PC 오른쪽 카드 */
const SIZE = {
  md: { title: "text-[15px]" },
  sm: { title: "text-sm" },
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
 * 「정산」 — 사람마다 차액 막대(받을 돈 · 보낼 돈, 아래 쓴 돈 · 결제한 돈), 점선 아래 송금(남은 것 먼저 · 보낸 것은 흐리게 긋고).
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
  const bars = diffBars(
    settle.people.map((p) => p.net),
    decimalsOf(home),
  );
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
          <p className="-mt-1 flex justify-between text-[11px] text-ink-350">
            <span>◀ 보낼 돈</span>
            <span>받을 돈 ▶</span>
          </p>
          {settle.people.map(({ person, spent, paid }, i) => {
            const a = avatarOf(person);
            const me = personKey(person) === settle.me;
            return (
              <DiffRow
                key={personKey(person)}
                person={person}
                name={me ? `${a.name} (나)` : a.name}
                url={a.url}
                spent={spent}
                paid={paid}
                bar={bars[i]}
                home={home}
                compact={pc}
                onClick={() => onOpen(personKey(person))}
              />
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
