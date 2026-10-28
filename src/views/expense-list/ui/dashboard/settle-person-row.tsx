import { PersonAvatar, type PersonRef } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

type SettlePersonRowProps = {
  person: PersonRef;
  name: string;
  url: string | null;
  /** 나 — 이름 뒤 회색 「(나)」 */
  me: boolean;
  spent: number;
  paid: number;
  home: string;
  /** PC 오른쪽 카드 — 조금 작게(아바타 28 · 이름 13 · 쓴 돈 14) */
  compact: boolean;
  onClick: () => void;
};

/** 정산 카드의 사람 한 줄(P37) — 아바타 30 · 이름 14/600 + 오른쪽 쓴 돈 15/800, 그 아래 11 회색 「결제 N」 */
export function SettlePersonRow({
  person,
  name,
  url,
  me,
  spent,
  paid,
  home,
  compact,
  onClick,
}: SettlePersonRowProps) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2.5 text-left">
      <PersonAvatar
        guest={person.kind === "guest"}
        name={name}
        url={url}
        className={compact ? "size-7" : "size-7.5"}
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-semibold text-ink-700",
          compact ? "text-[13px]" : "text-sm",
        )}
      >
        {name}
        {me && <span className="font-medium text-ink-350"> (나)</span>}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-px">
        <span
          className={cn(
            "font-extrabold whitespace-nowrap text-ink-900",
            compact ? "text-sm" : "text-[15px]",
          )}
        >
          {formatMoney(spent, home)}
        </span>
        <span className="text-[11px] whitespace-nowrap text-ink-400">
          결제 {formatMoney(paid, home)}
        </span>
      </span>
    </button>
  );
}
