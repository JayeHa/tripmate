"use client";

import { ArrowLeftRight, Info } from "lucide-react";
import { useState } from "react";

import { type PersonKey, personKey } from "@/entities/expense";
import { decimalsOf, formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

import { netBox } from "../../lib/settle-person";
import type { Dashboard } from "../../model/use-dashboard";
import type { ExpenseList } from "../../model/use-expense-list";
import { PersonAvatar } from "../dashboard/person-avatar";
import { PersonExpenseList } from "./person-expense-list";
import { SettleTransfers } from "./settle-transfers";

type SettlePersonProps = {
  list: ExpenseList;
  settle: NonNullable<Dashboard["settle"]>;
  avatarOf: Dashboard["avatarOf"];
  /** 처음 볼 사람(키). 없거나 모르는 사람이면 나, 나도 없으면 첫 사람 */
  initial: PersonKey | null;
};

/** 받을 돈 · 보낼 돈 상자의 색과 이름 */
const BOX = {
  recv: { label: "받을 돈", tone: "bg-brand-soft text-brand-text" },
  send: { label: "보낼 돈", tone: "bg-status-wait-bg text-status-wait-text" },
  none: { label: "정산 없음", tone: "bg-surface-muted text-ink-450" },
} as const;

/**
 * 정산 = 사람 상세 — 사람(「⇄ 바꾸기」 로 다음 사람) · 쓴 돈 / 결제한 돈 | 받을 돈 · 보낼 돈 상자 · 「어떻게 계산하나요?」,
 * 송금(내 송금 | 전체 송금), 결제한 비용 | 함께한 비용. 모바일 화면과 PC 창이 같이 쓴다.
 * 환율이 없는 비용이 있으면 계산하지 않고 그 통화를 알린다
 */
export function SettlePerson({ list, settle, avatarOf, initial }: SettlePersonProps) {
  const [chosen, setChosen] = useState(initial);
  const [explain, setExplain] = useState(false);
  const keys = settle.people.map((p) => personKey(p.person));
  const at = [chosen, settle.me].map((k) => (k ? keys.indexOf(k) : -1)).find((i) => i >= 0) ?? 0;
  const current = settle.people[at];
  if (settle.missing) {
    return (
      <p className="px-5 py-10 text-center text-[13px] text-ink-400">
        {settle.missing} 환율이 없어 정산을 계산하지 못했어요.
      </p>
    );
  }
  if (!current) return null;
  const home = list.trip.home_currency;
  const key = keys[at];
  const a = avatarOf(current.person);
  const me = key === settle.me;
  const box = netBox(current.net, decimalsOf(home));
  return (
    <>
      <div className="flex flex-col gap-3.5 px-5 pt-1.5 pb-4.5">
        <div className="flex items-center gap-3">
          <PersonAvatar person={current.person} name={a.name} url={a.url} className="size-11" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-lg font-extrabold text-ink-900">
              {a.name}
              {me && " (나)"}
            </span>
            <span className="text-[13px] text-ink-400">
              {keys.length}명 중 · {list.trip.title}
            </span>
          </div>
          {keys.length > 1 && (
            <button
              type="button"
              onClick={() => setChosen(keys[(at + 1) % keys.length])}
              className="flex h-8.5 shrink-0 items-center gap-1.25 rounded-full border border-line bg-white pr-3 pl-2.5 text-[13px] font-bold text-ink-700"
            >
              <ArrowLeftRight aria-hidden="true" className="size-3.75" />
              바꾸기
            </button>
          )}
        </div>
        <div className="flex items-stretch gap-3">
          <dl className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-1">
            <Amount label="쓴 돈" value={formatMoney(current.spent, home)} />
            <Amount label="결제한 돈" value={formatMoney(current.paid, home)} />
          </dl>
          <span className="w-px shrink-0 bg-divider" />
          <div
            className={cn(
              "flex w-37 shrink-0 flex-col justify-center gap-1 rounded-card px-3.5 py-3",
              BOX[box.kind].tone,
            )}
          >
            <span className="text-xs font-bold">{BOX[box.kind].label}</span>
            <span className="text-[22px] font-extrabold tracking-[-0.01em] whitespace-nowrap">
              {formatMoney(box.amount, home)}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={explain}
          onClick={() => setExplain((v) => !v)}
          className="flex items-center gap-1 self-start text-xs text-ink-400"
        >
          <Info aria-hidden="true" className="size-3.25 text-ink-350" />
          어떻게 계산하나요?
        </button>
        {explain && (
          <p className="rounded-memo bg-surface-sunken px-3 py-2.5 text-xs/relaxed text-ink-500">
            쓴 돈은 함께한 비용에서 내 몫을 더한 거예요. 결제한 돈 − 쓴 돈이 받을 돈(+) · 보낼
            돈(−)이고, 이미 보냈다고 적은 돈은 빼고 계산해요.
          </p>
        )}
      </div>
      <SettleTransfers list={list} settle={settle} person={key} avatarOf={avatarOf} />
      <PersonExpenseList list={list} person={current.person} me={me} name={a.name} />
      <p className="px-5 pt-3 text-xs text-ink-350">합계에서 제외한 비용은 정산에서 빠져요.</p>
    </>
  );
}

type AmountProps = { label: string; value: string };

/** 쓴 돈 · 결제한 돈 한 줄 — 왼쪽 이름, 오른쪽 금액 */
function Amount({ label, value }: AmountProps) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="flex-1 text-[13px] text-ink-450">{label}</dt>
      <dd className="text-sm font-bold whitespace-nowrap text-ink-900">{value}</dd>
    </div>
  );
}
