import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { personOfKey, type PersonRef } from "@/entities/expense";
import { cn } from "@/shared/lib/utils";

import { PersonAvatar } from "./person-avatar";

/** 표시 이름 · 사진 */
type AvatarOf = (person: PersonRef) => { name: string; url: string | null };

type MoreTransfersProps = { count: number; href: string | null; onOpen: () => void };

/** 「+ N건 더 보기」 — 주소가 있으면 그리로(모바일), 없으면 그 자리에서 펼친다(PC) */
export function MoreTransfers({ count, href, onOpen }: MoreTransfersProps) {
  const className = "self-start pt-1 text-[13px] font-bold text-ink-500";
  if (href) {
    return (
      <Link href={href} className={className}>
        + {count}건 더 보기
      </Link>
    );
  }
  return (
    <button type="button" onClick={onOpen} className={className}>
      + {count}건 더 보기
    </button>
  );
}

type TransferLineProps = {
  from: string;
  to: string;
  amount: string;
  done: boolean;
  avatarOf: AvatarOf;
  pc: boolean;
};

/** 송금 한 줄 — 보내는 사람 → 받는 사람 · 금액. 보낸 것은 흐리게 긋는다 */
export function TransferLine({ from, to, amount, done, avatarOf, pc }: TransferLineProps) {
  const text = cn(
    "font-semibold text-ink-700",
    pc ? "text-[13px]" : "text-sm",
    done && "line-through",
  );
  return (
    <div className={cn("flex items-center gap-2", pc ? "py-1.25" : "py-1.5", done && "opacity-45")}>
      <Side personKeyValue={from} avatarOf={avatarOf} className={text} pc={pc} />
      <ArrowRight aria-label="에게" className="size-3.5 shrink-0 text-handle" />
      <Side personKeyValue={to} avatarOf={avatarOf} className={text} pc={pc} />
      <span className="flex-1" />
      <b
        className={cn(
          "font-extrabold whitespace-nowrap text-ink-900",
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
        person={person}
        name={a.name}
        url={a.url}
        className={pc ? "size-5" : "size-5.5"}
      />
      <span className={cn("min-w-0 truncate", className)}>{a.name}</span>
    </>
  );
}
