"use client";

import { useState } from "react";

import { type PersonKey, personOfKey, useSettlementActions } from "@/entities/expense";
import { Segmented } from "@/shared/ui/segmented";

import { type TransferRow, transferRows } from "../../lib/dashboard";
import type { Dashboard } from "../../model/use-dashboard";
import type { ExpenseList } from "../../model/use-expense-list";
import { CancelTransferDialog } from "./cancel-transfer-dialog";
import { AllTransfers, MyTransfers } from "./transfer-lists";

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
 * 누르면 그 금액을 이미 보낸 돈으로 적고(송금 기록), 이미 적은 줄을 다시 누르면 확인 창을 거쳐 지운다(흐리게 긋고 ✓).
 * 기록하는 동안에는 다른 줄을 누를 수 없다
 */
export function SettleTransfers({ list, settle, person, avatarOf }: SettleTransfersProps) {
  const [all, setAll] = useState(false);
  const actions = useSettlementActions(list.trip.id);
  const pending = actions.add.isPending || actions.remove.isPending;
  // 마지막으로 시도한 기록의 실패만 알린다 — mutation 마다 isError 를 보면 다른 동작이 성공해도 지난 실패가 남는다
  const [failed, setFailed] = useState(false);
  const done = { onSuccess: () => setFailed(false), onError: () => setFailed(true) };
  const home = list.trip.home_currency;
  const rows = transferRows(settle.remaining, settle.sent, settle.me);
  const name = avatarOf(personOfKey(person) ?? { kind: "member", id: "" }).name;

  // 취소(기록 지우기)를 묻는 중인 줄 — 실수로 누른 한 번에 보낸 기록이 사라지지 않게
  const [canceling, setCanceling] = useState<TransferRow | null>(null);

  /** 남은 송금은 보낸 돈으로 적고, 적은 줄은 확인 창을 거쳐 지운다 */
  function toggle(t: TransferRow) {
    if (t.done) {
      setCanceling(t);
      return;
    }
    const from = personOfKey(t.from);
    const to = personOfKey(t.to);
    if (!from || !to || !list.meId) return;
    actions.add.mutate({ from, to, amount: t.amount, createdBy: list.meId }, done);
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
      <CancelTransferDialog
        row={canceling}
        home={home}
        me={settle.me}
        avatarOf={avatarOf}
        onClose={() => setCanceling(null)}
        onConfirm={(t) => actions.remove.mutate(t.key, done)}
      />
    </section>
  );
}
