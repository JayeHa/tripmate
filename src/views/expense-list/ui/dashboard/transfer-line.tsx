import { ArrowRight } from "lucide-react";

import { PersonAvatar, personOfKey, type PersonRef } from "@/entities/expense";
import { cn } from "@/shared/lib/utils";

/** 표시 이름 · 사진 */
type AvatarOf = (person: PersonRef) => { name: string; url: string | null };

type TransferLineProps = {
  from: string;
  to: string;
  amount: string;
  done: boolean;
  avatarOf: AvatarOf;
  pc: boolean;
  /** 금액 색 — 내가 받을 돈 블루 · 보낼 돈 주황(대시보드 「내 송금」). 없으면 잉크 */
  tone?: "receive" | "send";
};

/** 금액 색 */
const AMOUNT_TONE = {
  receive: "text-brand-text",
  send: "text-status-wait-text",
} as const;

/**
 * 송금 한 줄 — 보내는 사람 → 받는 사람 · 금액. 보낸 것은 흐리게 긋는다.
 * 보내는 사람 칸은 폭을 고정하고(모바일 88 · PC 80, 긴 이름은 말줄임) 받는 사람 칸이 남은 폭을 써서, 이름 길이와 상관없이 화살표가 같은 자리에 온다
 */
export function TransferLine({ from, to, amount, done, avatarOf, pc, tone }: TransferLineProps) {
  const text = cn(
    "font-semibold text-ink-700",
    pc ? "text-[13px]" : "text-sm",
    done && "line-through",
  );
  return (
    // min-w-0 — 격자(확인 창) · flex 안에서도 줄이 내용보다 좁아질 수 있게. 없으면 긴 이름이 말줄임되지 않고 금액이 밖으로 밀린다
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        pc ? "py-1.25" : "py-1.5",
        done && "opacity-45",
      )}
    >
      <span className={cn("flex shrink-0 items-center gap-2", pc ? "w-20" : "w-22")}>
        <Side personKeyValue={from} avatarOf={avatarOf} className={text} pc={pc} />
      </span>
      <ArrowRight aria-label="에게" className="size-3.5 shrink-0 text-handle" />
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <Side personKeyValue={to} avatarOf={avatarOf} className={text} pc={pc} />
      </span>
      <b
        className={cn(
          // 받는 사람과 금액 사이를 조금 더 띄운다(줄 gap 8 + 12)
          "pl-3 font-extrabold whitespace-nowrap",
          tone ? AMOUNT_TONE[tone] : "text-ink-900",
          pc ? "text-sm" : "text-[15px]",
          done && "line-through",
        )}
      >
        {amount}
      </b>
    </div>
  );
}

type SideProps = {
  personKeyValue: string;
  avatarOf: AvatarOf;
  className: string;
  pc: boolean;
};

/** 송금의 한쪽 사람 — 아바타 22(PC 20) + 이름 */
function Side({ personKeyValue, avatarOf, className, pc }: SideProps) {
  const person = personOfKey(personKeyValue);
  if (!person) return null;
  const a = avatarOf(person);
  return (
    <>
      <PersonAvatar
        guest={person.kind === "guest"}
        name={a.name}
        url={a.url}
        className={pc ? "size-5" : "size-5.5"}
      />
      <span className={cn("min-w-0 truncate", className)}>{a.name}</span>
    </>
  );
}
