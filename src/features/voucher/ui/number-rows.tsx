"use client";

import { Plus, Trash2 } from "lucide-react";

import { VOUCHER_NUMBER_LABELS } from "@/entities/voucher";
import { FILTER_ALL, FilterSelect } from "@/shared/ui/filter-select";
import { Input } from "@/shared/ui/input";

import { newNumber, type NumberDraft, NUMBERS_MAX } from "../lib/voucher-form";
import type { OwnerOption } from "../model/use-owner-options";

type NumberRowsProps = {
  numbers: NumberDraft[];
  onChange: (numbers: NumberDraft[]) => void;
  /** 번호 주인 고르기에 쓰는 멤버. 혼자인 여행이면 null(고르기를 숨긴다) */
  members: OwnerOption[] | null;
};

/**
 * 「번호」 — 줄마다 테두리 칸(r12): 위에 종류 · 주인(모두 · 멤버) 고르기와 휴지통, 아래 번호 입력(15/700, 글자 간격 .03em).
 * 아래 점선 「+ 번호 추가」(10줄까지). 첫 줄은 「예약번호」, 그다음은 「바우처 번호」 로 시작한다.
 * 창 안이라 고르기는 늘 드롭다운이다(시트 위에 시트가 뜨지 않게)
 */
export function NumberRows({ numbers, onChange, members }: NumberRowsProps) {
  /** i 번째 줄을 고친다 */
  const update = (uid: string, patch: Partial<NumberDraft>) =>
    onChange(numbers.map((n) => (n.uid === uid ? { ...n, ...patch } : n)));
  return (
    <div className="flex flex-col gap-2">
      {numbers.map((n) => (
        <div key={n.uid} className="flex flex-col gap-1.5 rounded-card border border-input p-2.5">
          <div className="flex items-center gap-1.5">
            <FilterSelect
              label="종류"
              allLabel={null}
              layout="dropdown"
              value={n.label}
              onChange={(label) => update(n.uid, { label })}
              options={VOUCHER_NUMBER_LABELS.map((l) => ({ value: l, label: l }))}
            />
            {members && (
              <FilterSelect
                label="모두"
                allLabel="모두"
                layout="dropdown"
                value={n.owner || FILTER_ALL}
                onChange={(owner) => update(n.uid, { owner: owner === FILTER_ALL ? "" : owner })}
                options={members.map((m) => ({ value: m.id, label: m.name }))}
              />
            )}
            <span className="flex-1" />
            <button
              type="button"
              aria-label={`${n.label} 줄 지우기`}
              onClick={() => onChange(numbers.filter((x) => x.uid !== n.uid))}
              className="flex p-1 text-ink-350"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
          <Input
            value={n.value}
            onChange={(e) => update(n.uid, { value: e.target.value })}
            maxLength={100}
            placeholder="번호"
            aria-label={n.label}
            className="font-bold tracking-[0.03em]"
          />
        </div>
      ))}
      {numbers.length < NUMBERS_MAX && (
        <button
          type="button"
          onClick={() => onChange([...numbers, newNumber(numbers.length)])}
          className="flex h-9.5 items-center justify-center gap-1 rounded-memo border-[1.5px] border-dashed border-line-dashed text-[13px] font-bold text-primary"
        >
          <Plus className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          번호 추가
        </button>
      )}
    </div>
  );
}
