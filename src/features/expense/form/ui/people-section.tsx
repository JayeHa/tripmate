import { Check, Split, Users } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { ExpenseFormState } from "../model/use-expense-form";
import type { FormPerson } from "../model/use-people-picker";
import { PersonChip } from "./person-chip";

type PeopleSectionProps = { form: ExpenseFormState };

/**
 * 「누가 내고, 누구와 나눴나요?」 — 결제한 사람(한 명 또는 「각자 냄」) · 함께한 사람(여러 명, 「모두」) · 미리보기.
 * 혼자 쓰는 가계부(사람이 나뿐)면 섹션 대신 「내가 결제했어요」 한 줄
 */
export function PeopleSection({ form }: PeopleSectionProps) {
  const { picker, people } = form;
  if (people.length === 1) return <SoloCard me={people[0]} />;
  return (
    <section className="flex flex-col gap-4 rounded-card bg-surface-sunken p-4">
      <div className="flex flex-col gap-0.75">
        <h2 className="text-[15px] font-extrabold text-ink-900">누가 내고, 누구와 나눴나요?</h2>
        <p className="text-xs/normal text-ink-450">
          나눠 낸 비용이면 함께한 사람을 모두 골라 주세요. 정산에 반영돼요.
        </p>
      </div>
      <PeopleRow label="결제한 사람">
        <ToggleChip on={picker.splitEach} dark icon={Split} onClick={picker.toggleSplitEach}>
          각자 냄
        </ToggleChip>
        {people.map((p) => (
          <PersonChip
            key={p.key}
            person={p}
            variant="payer"
            selected={picker.payer === p.key}
            onClick={() => picker.pickPayer(p.key)}
          />
        ))}
      </PeopleRow>
      <PeopleRow label="함께한 사람">
        <ToggleChip on={picker.allIn} icon={Users} onClick={picker.toggleAll}>
          모두
        </ToggleChip>
        {people.map((p) => (
          <PersonChip
            key={p.key}
            person={p}
            variant="with"
            selected={picker.participants.includes(p.key)}
            onClick={() => picker.toggleParticipant(p.key)}
          />
        ))}
      </PeopleRow>
      {form.preview && (
        <div className="flex flex-col gap-1 border-t border-divider pt-3">
          <p className="text-[13px] font-bold text-brand-text">{form.preview.head}</p>
          {form.preview.sub && <p className="text-xs/normal text-ink-500">{form.preview.sub}</p>}
        </div>
      )}
    </section>
  );
}

type PeopleRowProps = { label: string; children: [React.ReactNode, React.ReactNode] };

/**
 * 사람 한 줄 — 첫 칩(각자 냄 · 모두)과 사람 칩들. 모바일은 첫 칩을 혼자 한 줄에 두고 사람은 다음 줄부터,
 * PC 는 세로 구분선을 두고 한 줄로 잇는다(넘치면 줄 넘김)
 */
function PeopleRow({ label, children: [first, chips] }: PeopleRowProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-ink-700">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {first}
        <span aria-hidden="true" className="basis-full lg:hidden" />
        <span aria-hidden="true" className="hidden h-5.5 w-px bg-line-strong lg:block" />
        {chips}
      </div>
    </div>
  );
}

type ToggleChipProps = {
  on: boolean;
  /** 켜졌을 때 잉크로 채운다(각자 냄). 아니면 연한 블루 + ✓(모두) */
  dark?: boolean;
  icon: typeof Users;
  onClick: () => void;
  children: React.ReactNode;
};

/** 꺼져 있으면 점선 테두리인 켜고 끄는 칩 — 「각자 냄」 · 「모두」 */
function ToggleChip({ on, dark = false, icon: Icon, onClick, children }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] pr-3 pl-2.5 text-[13px] font-bold",
        !on && "border-dashed border-line-dashed bg-white text-ink-500",
        on && dark && "border-ink-900 bg-ink-900 text-white",
        on && !dark && "border-primary bg-brand-soft text-brand-text",
      )}
    >
      <Icon className="size-3.75" aria-hidden="true" />
      {children}
      {on && !dark && <Check className="size-3.25" strokeWidth={3} aria-hidden="true" />}
    </button>
  );
}

type SoloCardProps = { me: FormPerson };

/** 혼자 쓰는 가계부 — 고를 사람이 없어 「내가 결제했어요」 만 알린다 */
function SoloCard({ me }: SoloCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-card bg-surface-sunken px-4 py-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-extrabold text-white">
        {me.name.slice(0, 1)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-bold text-ink-900">
          {me.name}(나)이 결제했어요
        </span>
        <span className="text-xs text-ink-450">
          혼자 쓰는 가계부라 정산 없이 내 지출로 기록돼요
        </span>
      </div>
    </div>
  );
}
