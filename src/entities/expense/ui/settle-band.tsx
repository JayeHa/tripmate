import { Check, ChevronRight, CircleCheck, Users } from "lucide-react";

import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

import type { PersonKey } from "../lib/person";
import type { SettleBandState } from "../lib/settle-band";

type BandPerson = { name: string; avatarUrl: string | null };

type SettleBandProps = {
  state: SettleBandState;
  /** 기준 화폐 — 금액 표시 */
  home: string;
  /** 사람 키 → 이름 · 사진 */
  personOf: (key: PersonKey) => BandPerson;
  /** 어떤 상태든 누르면 정산 화면으로 */
  onClick: () => void;
  /** PC 는 44 · 12/600, 모바일은 46 · 13/600 */
  size?: "md" | "sm";
};

/** 띠 문구 · 오른쪽 링크 글 */
function copyOf(state: SettleBandState, home: string, personOf: SettleBandProps["personOf"]) {
  if (state.kind === "recv" || state.kind === "send") {
    const who =
      state.people.length === 1 ? personOf(state.people[0]).name : `${state.people.length}명`;
    const what = state.kind === "recv" ? "받을 돈" : "보낼 돈";
    return {
      text: `${who}에게 ${what} ${formatMoney(state.amount, home)}`,
      link: state.kind === "recv" ? "정산하기" : "보내기",
    };
  }
  if (state.kind === "done" && state.pending > 0) {
    return { text: `내 정산은 끝났어요 · 일행 정산 ${state.pending}건 남음`, link: "보기" };
  }
  if (state.kind === "done") return { text: "모두 정산됐어요", link: null };
  return { text: "나눠 낸 비용이 생기면 여기서 정산을 알려드려요", link: null };
}

/** 띠 왼쪽 — 주고받을 사람의 아바타(겹침), 아니면 상태 아이콘 */
function Leading({ state, personOf }: Pick<SettleBandProps, "state" | "personOf">) {
  if (state.kind === "recv" || state.kind === "send") {
    return (
      <span className="flex shrink-0 -space-x-1.5">
        {state.people.slice(0, 3).map((key) => {
          const p = personOf(key);
          return (
            <Avatar key={key} size="sm" className="size-5.5 ring-2 ring-white">
              {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt="" />}
              <AvatarFallback>{p.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
          );
        })}
      </span>
    );
  }
  const Icon = {
    done: state.kind === "done" && state.pending > 0 ? Check : CircleCheck,
    none: Users,
  }[state.kind];
  return <Icon aria-hidden="true" className="size-4.5 shrink-0 text-ink-450" />;
}

/**
 * 정산 띠 — 내 입장의 정산 한 줄(높이 고정, 내용만 바뀐다). 받을 돈만 연한 파랑, 나머지는 연한 회색.
 * 빨강 · 주황은 「예정일 지남」 · 「예약 필요」 와 섞여 쓰지 않는다. 혼자 쓰는 가계부는 부른 쪽이 띠를 그리지 않는다
 */
export function SettleBand({ state, home, personOf, onClick, size = "md" }: SettleBandProps) {
  const { text, link } = copyOf(state, home, personOf);
  const recv = state.kind === "recv";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-memo px-3 text-left",
        size === "md" ? "h-11.5" : "h-11",
        recv ? "bg-brand-soft" : "bg-surface-muted",
      )}
    >
      <Leading state={state} personOf={personOf} />
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-semibold text-ink-900",
          size === "md" ? "text-[13px]" : "text-xs",
        )}
      >
        {text}
      </span>
      {link && (
        <span
          className={cn("shrink-0 text-xs font-medium", recv ? "text-brand-text" : "text-ink-500")}
        >
          {link}
        </span>
      )}
      <ChevronRight
        aria-hidden="true"
        className={cn("size-4 shrink-0", recv ? "text-brand-text" : "text-ink-400")}
      />
    </button>
  );
}
