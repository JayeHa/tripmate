import { ArrowRight } from "lucide-react";

import { personOfKey, type PersonRef } from "@/entities/expense";
import { cn } from "@/shared/lib/utils";

import { PersonAvatar } from "./person-avatar";

/** 표시 이름 · 사진 */
type AvatarOf = (person: PersonRef) => { name: string; url: string | null };

type MoreTransfersProps = { count: number; onClick: () => void };

/** 「+ N건 더 보기」 — 모바일은 정산 화면으로, PC 는 그 자리에서 펼친다(부른 쪽이 정한다) */
export function MoreTransfers({ count, onClick }: MoreTransfersProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start pt-1 text-[13px] font-bold text-ink-500"
    >
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

/**
 * 송금 한 줄 — 보내는 사람 → 받는 사람 · 금액. 보낸 것은 흐리게 긋는다.
 * 보내는 사람 칸은 폭을 고정하고(모바일 88 · PC 80, 긴 이름은 말줄임) 받는 사람 칸이 남은 폭을 써서, 이름 길이와 상관없이 화살표가 같은 자리에 온다
 */
export function TransferLine({ from, to, amount, done, avatarOf, pc }: TransferLineProps) {
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
          "pl-3 font-extrabold whitespace-nowrap text-ink-900",
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
