import { type PersonKey, personOfKey } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { CheckMark } from "@/shared/ui/check-mark";

import type { TransferRow } from "../../lib/dashboard";
import { personTransfers } from "../../lib/settle-person";
import type { Dashboard } from "../../model/use-dashboard";
import { PersonAvatar } from "../dashboard/person-avatar";
import { TransferLine } from "../dashboard/transfer-line";

type ListProps = {
  rows: TransferRow[];
  home: string;
  avatarOf: Dashboard["avatarOf"];
  pending: boolean;
  onToggle: (t: TransferRow) => void;
};

/** 내 송금 — 상대 아바타 30 · 「동규에게 ₩54,210 받아요」 · 「받았어요」(적었으면 회색 「받았어요 ✓」) */
export function MyTransfers({
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
export function AllTransfers({ rows, home, avatarOf, pending, onToggle }: ListProps) {
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
