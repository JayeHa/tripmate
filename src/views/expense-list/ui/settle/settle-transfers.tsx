"use client";

import { useState } from "react";

import { type PersonKey, personOfKey, useSettlementActions } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { CheckMark } from "@/shared/ui/check-mark";
import { Segmented } from "@/shared/ui/segmented";

import { type TransferRow, transferRows } from "../../lib/dashboard";
import { personTransfers } from "../../lib/settle-person";
import type { Dashboard } from "../../model/use-dashboard";
import type { ExpenseList } from "../../model/use-expense-list";
import { PersonAvatar } from "../dashboard/person-avatar";
import { TransferLine } from "../dashboard/transfer-line";

type SettleTransfersProps = {
  list: ExpenseList;
  settle: NonNullable<Dashboard["settle"]>;
  /** 보고 있는 사람 */
  person: PersonKey;
  avatarOf: Dashboard["avatarOf"];
};

/**
 * 「송금」 — 세그먼트 「내 송금(다른 사람이면 「동규 송금」) | 전체 송금」.
 * 내 송금: 「동규에게 ₩54,210 받아요」 + 「받았어요 / 보냈어요」, 전체 송금: 체크 + 보내는 사람 → 받는 사람.
 * 누르면 그 금액을 이미 보낸 돈으로 적고(송금 기록), 이미 적은 줄을 다시 누르면 지운다(흐리게 긋고 ✓).
 * 기록하는 동안에는 다른 줄을 누를 수 없다
 */
export function SettleTransfers({ list, settle, person, avatarOf }: SettleTransfersProps) {
  const [all, setAll] = useState(false);
  const actions = useSettlementActions(list.trip.id);
  const pending = actions.add.isPending || actions.remove.isPending;
  const failed = actions.add.isError || actions.remove.isError;
  const home = list.trip.home_currency;
  const rows = transferRows(settle.remaining, settle.sent, settle.me);
  const name = avatarOf(personOfKey(person) ?? { kind: "member", id: "" }).name;

  /** 남은 송금은 보낸 돈으로 적고, 적은 줄은 지운다 */
  function toggle(t: TransferRow) {
    if (t.done) {
      actions.remove.mutate(t.key);
      return;
    }
    const from = personOfKey(t.from);
    const to = personOfKey(t.to);
    if (!from || !to || !list.meId) return;
    actions.add.mutate({ from, to, amount: t.amount, createdBy: list.meId });
  }

  return (
    <section className="flex flex-col gap-3 border-t-8 border-surface-sunken px-5 py-4.5">
      <div className="flex items-center">
        <h2 className="flex-1 text-[15px] font-extrabold text-ink-900">송금</h2>
        <Segmented
          aria-label="송금 보기"
          options={[
            { value: "mine", label: person === settle.me ? "내 송금" : `${name} 송금` },
            { value: "all", label: "전체 송금" },
          ]}
          value={all ? "all" : "mine"}
          onChange={(v) => setAll(v === "all")}
        />
      </div>
      {failed && (
        <p role="alert" className="text-[13px] text-destructive">
          송금 기록을 바꾸지 못했어요. 다시 시도해 주세요.
        </p>
      )}
      {all ? (
        <AllTransfers
          rows={rows}
          home={home}
          avatarOf={avatarOf}
          pending={pending}
          onToggle={toggle}
        />
      ) : (
        <MyTransfers
          rows={rows}
          person={person}
          home={home}
          avatarOf={avatarOf}
          pending={pending}
          onToggle={toggle}
        />
      )}
    </section>
  );
}

type ListProps = {
  rows: TransferRow[];
  home: string;
  avatarOf: Dashboard["avatarOf"];
  pending: boolean;
  onToggle: (t: TransferRow) => void;
};

/** 내 송금 — 상대 아바타 30 · 「동규에게 ₩54,210 받아요」 · 「받았어요」(적었으면 회색 「받았어요 ✓」) */
function MyTransfers({
  rows,
  person,
  home,
  avatarOf,
  pending,
  onToggle,
}: ListProps & { person: PersonKey }) {
  const mine = personTransfers(rows, person);
  if (mine.length === 0) return <p className="text-[13px] text-ink-400">주고받을 돈이 없어요.</p>;
  return (
    <>
      {mine.map((t) => {
        const other = personOfKey(t.other);
        if (!other) return null;
        const a = avatarOf(other);
        const done = t.settlementId !== null;
        const row = rows.find((r) => r.key === t.key);
        const verb = t.receive ? "받았어요" : "보냈어요";
        return (
          <div key={t.key} className={cn("flex items-center gap-2.5 py-2", done && "opacity-45")}>
            <PersonAvatar person={other} name={a.name} url={a.url} className="size-7.5" />
            <span
              className={cn(
                "min-w-0 flex-1 text-[15px] font-bold text-ink-900",
                done && "line-through",
              )}
            >
              {a.name}에게 {formatMoney(t.amount, home)} {t.receive ? "받아요" : "보내요"}
            </span>
            <button
              type="button"
              disabled={pending}
              aria-pressed={done}
              onClick={() => row && onToggle(row)}
              className={cn(
                "flex h-8 shrink-0 items-center rounded-full border px-3 text-[13px] font-bold disabled:opacity-50",
                done && "border-surface-muted bg-surface-muted text-ink-400",
                !done && t.receive && "border-brand-line bg-white text-brand-text",
                !done && !t.receive && "border-status-wait-line bg-white text-status-wait-text",
              )}
            >
              {done ? `${verb} ✓` : verb}
            </button>
          </div>
        );
      })}
    </>
  );
}

/** 전체 송금 — 체크(적었으면 파랑) + 보내는 사람 → 받는 사람 · 금액 */
function AllTransfers({ rows, home, avatarOf, pending, onToggle }: ListProps) {
  if (rows.length === 0) {
    return <p className="text-[13px] text-ink-400">각자 낸 만큼 썼어요 · 정산할 금액이 없어요</p>;
  }
  return (
    <>
      {rows.map((t) => (
        <button
          type="button"
          key={t.key}
          role="checkbox"
          aria-checked={t.done}
          disabled={pending}
          onClick={() => onToggle(t)}
          className="flex items-center gap-2.5 text-left disabled:opacity-50"
        >
          <CheckMark checked={t.done} shape="square" />
          <span className="min-w-0 flex-1">
            <TransferLine
              from={t.from}
              to={t.to}
              amount={formatMoney(t.amount, home)}
              done={t.done}
              avatarOf={avatarOf}
              pc={false}
            />
          </span>
        </button>
      ))}
    </>
  );
}
