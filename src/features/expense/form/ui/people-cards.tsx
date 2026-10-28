import { ChevronDown, UserPlus } from "lucide-react";

import { PersonAvatar } from "@/entities/expense";

import { peopleSummary } from "../lib/people-summary";
import type { ExpenseFormState } from "../model/use-expense-form";
import type { FormPerson } from "../model/use-people-picker";

type FoldedSectionProps = { form: ExpenseFormState; onOpen: () => void };

/** 접힌 카드 — 「누가 내고, 누구와 나눴나요?」 14/700 / 「정원 결제 · 2명 모두 함께」 13/500 한 줄 말줄임 + ⌄ */
export function FoldedSection({ form, onOpen }: FoldedSectionProps) {
  const { picker, people } = form;
  // 목록에서 빠진 사람(옛 비용)은 폼 본체처럼 「알 수 없음」 — 빈 이름이 끼지 않게
  const nameOf = (key: string) => people.find((p) => p.key === key)?.name ?? "알 수 없음";
  const summary = peopleSummary({
    payer: picker.payer,
    participants: picker.participants,
    allIn: picker.allIn,
    everyone: people.length,
    nameOf,
  });
  return (
    <button
      type="button"
      aria-expanded={false}
      onClick={onOpen}
      className="flex items-center gap-2 rounded-card bg-surface-sunken px-4 py-3.5 text-left"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-bold text-ink-900">누가 내고, 누구와 나눴나요?</span>
        <span className="truncate text-[13px] font-medium text-ink-500">
          {summary.lead && <b className="font-bold text-ink-900">{summary.lead}</b>}
          {summary.rest}
        </span>
      </span>
      <ChevronDown className="size-4.5 shrink-0 text-ink-450" aria-hidden="true" />
    </button>
  );
}

type AddPersonButtonProps = { onClick: () => void };

/** 「+ 인원 추가」 — 30 흰 pill, 블루 글자 */
export function AddPersonButton({ onClick }: AddPersonButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7.5 shrink-0 items-center gap-1 rounded-full border border-line bg-white pr-2.5 pl-2 text-[13px] font-bold text-brand-text"
    >
      <UserPlus className="size-3.5 text-primary" aria-hidden="true" />
      인원 추가
    </button>
  );
}

type SoloCardProps = { me: FormPerson; onAdd: () => void };

/** 혼자 쓰는 가계부 — 고를 사람이 없어 「내가 결제했어요」 를 알리고, 아래에 「누군가와 나눠 냈다면 + 인원 추가」 */
export function SoloCard({ me, onAdd }: SoloCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-surface-sunken px-4 py-3.5">
      <div className="flex items-center gap-3">
        <PersonAvatar
          name={me.name}
          url={me.avatarUrl}
          guest={false}
          className="size-9"
          fallbackClassName="text-[13px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-bold text-ink-900">
            {me.name}(나)이 결제했어요
          </span>
          <span className="text-xs text-ink-450">
            혼자 쓰는 가계부라 정산 없이 내 지출로 기록돼요
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-divider pt-2.5">
        <span className="flex-1 text-xs text-ink-450">누군가와 나눠 냈다면</span>
        <AddPersonButton onClick={onAdd} />
      </div>
    </div>
  );
}
