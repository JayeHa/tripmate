import { Check, ChevronDown, Split, Users } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";

import type { ExpenseFormState } from "../model/use-expense-form";
import type { FormPrefs } from "../model/use-form-prefs";
import { useGuestEditor } from "../model/use-guest-editor";
import { GuestSheet } from "./guest-sheet";
import { AddPersonButton, FoldedSection, SoloCard } from "./people-cards";
import { PersonChip } from "./person-chip";

type PeopleSectionProps = {
  form: ExpenseFormState;
  /** 카드를 펼쳐 두는지(기기별) */
  prefs: Pick<FormPrefs, "peopleOpen" | "setPeopleOpen">;
};

/**
 * 「누가 내고, 누구와 나눴나요?」 — 결제한 사람(한 명 또는 「각자 냄」) · 함께한 사람(여러 명, 「모두」) · 미리보기.
 * 혼자 쓰는 가계부(사람이 나뿐)면 섹션 대신 「내가 결제했어요」 카드. 둘 다 「+ 인원 추가」 로 정산 인원 시트를 연다.
 * 결제 · 함께 두 줄 모두에 들어가는 사람이라 추가 버튼은 줄이 아니라 섹션 제목 옆에 둔다.
 * 일행 카드는 머리를 누르면 그 자리에서 접혀 두 줄 요약이 된다(기기별 기억, 기본 펼침). 인원을 더하면 한 번 펼친다
 */
export function PeopleSection({ form, prefs }: PeopleSectionProps) {
  const { picker, people } = form;
  const [sheetOpen, setSheetOpen] = useState(false);
  const editor = useGuestEditor({
    tripId: form.tripId,
    onAdded: (key) => {
      picker.include(key);
      // 더한 사람이 들어간 것을 보이게 한 번 펼친다 — 접어 둔 설정은 그대로 둔다
      prefs.setPeopleOpen(true, false);
    },
    onRemoved: picker.forget,
  });
  const sheet = (
    <GuestSheet
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      tripId={form.tripId}
      people={people}
      me={form.me}
      editor={editor}
    />
  );
  // 시트는 두 갈래 모두 같은 자리(둘째 자식)에 둔다 — 첫 인원을 넣어 혼자 → 일행으로 바뀌어도
  // 시트가 다시 마운트되지 않게(닫혔다 열리는 애니메이션 · 이름 칸 포커스 · 모바일 키보드가 끊기지 않게)
  const openSheet = () => setSheetOpen(true);
  return (
    <>
      {people.length === 1 ? (
        <SoloCard me={people[0]} onAdd={openSheet} />
      ) : (
        <SharedSection
          form={form}
          onAdd={openSheet}
          open={prefs.peopleOpen}
          onOpenChange={prefs.setPeopleOpen}
        />
      )}
      {sheet}
    </>
  );
}

type SharedSectionProps = {
  form: ExpenseFormState;
  onAdd: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * 일행이 있는 가계부의 섹션 — 제목 + 「+ 인원 추가」, 결제한 사람 줄, 함께한 사람 줄, 미리보기.
 * 접히면 「누가 내고, 누구와」 + 지금 값 한 줄(결제한 사람 이름만 굵게)
 */
function SharedSection({ form, onAdd, open, onOpenChange }: SharedSectionProps) {
  const { picker, people } = form;
  if (!open) return <FoldedSection form={form} onOpen={() => onOpenChange(true)} />;
  return (
    <section className="flex flex-col gap-4 rounded-card bg-surface-sunken p-4">
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          aria-expanded
          onClick={() => onOpenChange(false)}
          className="flex min-w-0 flex-1 items-start gap-1.5 text-left"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.75">
            <span className="text-[15px] font-extrabold text-ink-900">
              누가 내고, 누구와 나눴나요?
            </span>
            <span className="text-xs/normal text-ink-450">
              나눠 낸 비용이면 함께한 사람을 모두 골라 주세요. 정산에 반영돼요.
            </span>
          </span>
          <ChevronDown
            className="mt-0.5 size-4.5 shrink-0 rotate-180 text-ink-450"
            aria-hidden="true"
          />
        </button>
        <AddPersonButton onClick={onAdd} />
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
