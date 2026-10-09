"use client";

import { Check, ChevronDown, Info } from "lucide-react";
import { useState } from "react";

import { type PersonKey, personKey } from "@/entities/expense";
import { decimalsOf, formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { FilterSelect } from "@/shared/ui/filter-select";

import { transferRows } from "../../lib/dashboard";
import { personTransfers, settleState, settleSub } from "../../lib/settle-person";
import type { Dashboard } from "../../model/use-dashboard";
import type { ExpenseList } from "../../model/use-expense-list";
import { PersonAvatar } from "../dashboard/person-avatar";
import { PersonExpenseList } from "./person-expense-list";
import { SettleExplain } from "./settle-explain";
import { SettleTransfers } from "./settle-transfers";

type SettlePersonProps = {
  list: ExpenseList;
  settle: NonNullable<Dashboard["settle"]>;
  avatarOf: Dashboard["avatarOf"];
  /** 처음 볼 사람(키). 없거나 모르는 사람이면 나, 나도 없으면 첫 사람 */
  initial: PersonKey | null;
};

/** 받을 돈 · 보낼 돈 상자의 색과 이름 — 일부를 주고받았으면 이름 뒤에 「 · 남은 금액」, 모두 끝나면 회색 「정산 끝」 */
const BOX = {
  recv: { label: "받을 돈", tone: "bg-brand-soft text-brand-text" },
  send: { label: "보낼 돈", tone: "bg-status-wait-bg text-status-wait-text" },
  none: { label: "정산 없음", tone: "bg-surface-muted text-ink-450" },
  done: { label: "정산 끝", tone: "bg-surface-muted text-ink-450" },
} as const;

/**
 * 정산 = 사람 상세 — 사람(이름 머리를 누르면 PC 드롭다운 · 모바일 시트 「누구 기준으로 볼까요?」) ·
 * 쓴 돈 / 결제한 돈 | 받을 돈 · 보낼 돈 상자(남은 금액) · 「어떻게 계산하나요?」(시트),
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
  const decimals = decimalsOf(home);
  const rows = transferRows(settle.remaining, settle.sent, settle.me);
  /** 그 사람의 상자 상태 — 남은 차액 · 그 사람 송금 기록 */
  const stateOf = (k: string, net: number) => settleState(net, decimals, personTransfers(rows, k));
  const box = stateOf(key, current.net);
  const money = (n: number) => formatMoney(n, home);
  return (
    <>
      <div className="flex flex-col gap-3.5 px-5 pt-1.5 pb-4.5">
        <FilterSelect
          label="보는 사람"
          sheetTitle="누구 기준으로 볼까요?"
          allLabel={null}
          value={key}
          onChange={setChosen}
          options={settle.people.map((p, i) => {
            const pa = avatarOf(p.person);
            return {
              value: keys[i],
              label: keys[i] === settle.me ? `${pa.name} (나)` : pa.name,
              sub: settleSub(stateOf(keys[i], p.net), money),
              icon: (
                <PersonAvatar person={p.person} name={pa.name} url={pa.url} className="size-7" />
              ),
            };
          })}
          trigger={
            <button type="button" className="flex items-center gap-3 self-start text-left">
              <PersonAvatar person={current.person} name={a.name} url={a.url} className="size-11" />
              <span className="flex min-w-0 flex-col gap-0.5">
                {/* ⌄ 를 이름 바로 옆에 둬 눌러서 고르는 칸임을 알린다 */}
                <span className="flex min-w-0 items-center gap-1">
                  <span className="truncate text-lg font-extrabold text-ink-900">
                    {a.name}
                    {me && " (나)"}
                  </span>
                  <ChevronDown aria-hidden="true" className="size-4.5 shrink-0 text-ink-400" />
                </span>
                <span className="truncate text-[13px] text-ink-400">{settleSub(box, money)}</span>
              </span>
            </button>
          }
        />
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
            <span className="text-xs font-bold">
              {BOX[box.kind].label}
              {box.partial && " · 남은 금액"}
            </span>
            <span className="flex items-center gap-1 text-[22px] font-extrabold tracking-[-0.01em] whitespace-nowrap">
              {box.kind === "done" ? (
                <>
                  <Check aria-hidden="true" className="size-5" strokeWidth={3} />
                  완료
                </>
              ) : (
                money(box.amount)
              )}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setExplain(true)}
          className="flex items-center gap-1 self-start text-xs text-ink-400"
        >
          <Info aria-hidden="true" className="size-3.25 text-ink-350" />
          어떻게 계산하나요?
        </button>
        <SettleExplain open={explain} onClose={() => setExplain(false)} />
      </div>
      {/* 사람이 바뀌면 새로 그린다 — 송금 탭 · 기록 실패 안내 · 비용 탭이 앞 사람 것으로 남지 않게 */}
      <SettleTransfers
        key={`t-${key}`}
        list={list}
        settle={settle}
        person={key}
        avatarOf={avatarOf}
      />
      <PersonExpenseList
        key={`e-${key}`}
        list={list}
        person={current.person}
        me={me}
        name={a.name}
      />
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
