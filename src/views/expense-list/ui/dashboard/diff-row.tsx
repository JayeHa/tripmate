import type { PersonRef } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

import type { DiffBar } from "../../lib/diff-bar";
import { PersonAvatar } from "./person-avatar";

/** 차액 글 색 — 받을 돈 블루 · 보낼 돈 주황 · 정산 없음 회색 */
const DIFF_TONE: Record<DiffBar["side"], string> = {
  receive: "text-brand-text",
  send: "text-status-wait-text",
  none: "text-ink-400",
};

/** 막대 색 — 받을 돈 블루 · 보낼 돈 주황 */
const BAR_TONE: Record<DiffBar["side"], string> = {
  receive: "bg-brand",
  send: "bg-status-wait",
  none: "",
};

type DiffRowProps = {
  person: PersonRef;
  name: string;
  url: string | null;
  spent: number;
  paid: number;
  bar: DiffBar;
  home: string;
  /** PC 오른쪽 카드 — 조금 작게(막대 12) */
  compact: boolean;
  onClick: () => void;
};

/**
 * 정산 카드의 사람 한 줄(P37) — 아바타 30 · 이름 14/700 + 오른쪽 차액 12/800(「+N 받을 돈」 · 「−N 보낼 돈」 · 「정산 없음」),
 * 아래 막대(트랙 #F7F8FA, 가운데 0선, 오른쪽 블루 = 받을 돈 · 왼쪽 주황 = 보낼 돈), 그 아래 11 회색 「쓴 돈 N · 결제 N」
 */
export function DiffRow({
  person,
  name,
  url,
  spent,
  paid,
  bar,
  home,
  compact,
  onClick,
}: DiffRowProps) {
  const amount = formatMoney(Math.abs(bar.net), home);
  const diff = { receive: `+${amount} 받을 돈`, send: `−${amount} 보낼 돈`, none: "정산 없음" }[
    bar.side
  ];
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2.5 text-left">
      <PersonAvatar
        person={person}
        name={name}
        url={url}
        className={compact ? "size-7" : "size-7.5"}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1.25">
        <span className="flex items-baseline gap-1.5">
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink-900">{name}</span>
          <span className={cn("shrink-0 text-xs font-extrabold", DIFF_TONE[bar.side])}>{diff}</span>
        </span>
        <span className={cn("relative rounded-tag bg-surface-sunken", compact ? "h-3" : "h-3.5")}>
          <span aria-hidden="true" className="absolute -inset-y-0.5 left-1/2 w-px bg-line-dashed" />
          {bar.width > 0 && (
            <span
              aria-hidden="true"
              className={cn("absolute inset-y-0.5 rounded-[3px]", BAR_TONE[bar.side])}
              style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
            />
          )}
        </span>
        <span className="flex justify-between text-[11px] text-ink-350">
          <span>쓴 돈 {formatMoney(spent, home)}</span>
          <span>결제 {formatMoney(paid, home)}</span>
        </span>
      </span>
    </button>
  );
}
