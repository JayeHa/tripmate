import { Link2, MapPin, Paperclip, StickyNote } from "lucide-react";

import {
  amountLines,
  ExpenseBadge,
  ExpenseCategoryTile,
  type ExpenseRowView,
  PersonAvatar,
  type PersonRef,
  withLine,
} from "@/entities/expense";
import { cn } from "@/shared/lib/utils";

import type { AmountMode } from "../../model/use-pc-list";
import { TABLE_COLUMNS } from "./columns";

type ExpenseTableRowProps = {
  row: ExpenseRowView;
  /** 금액순일 때 이름 앞에 붙는 날 — 「day 2」 · 「준비」. 날짜 묶음이면 null */
  tag: string | null;
  /** 오른쪽에 상세가 열린 줄 — 연한 파랑 */
  selected: boolean;
  /** 영수증이 붙어 있다 — 이름 옆 클립 */
  hasReceipt: boolean;
  /** 줄을 눌렀다 — 오른쪽에 상세를 연다 */
  onSelect: () => void;
  onMarkPaid: () => void;
  /** 결제 완료로 바꾸는 중 */
  paying: boolean;
  mode: AmountMode;
  displayNameOf: (person: PersonRef) => string;
  /** 사람의 프로필 사진 — 정산 인원 · 사진이 없으면 url null(첫 글자) */
  avatarOf: (person: PersonRef) => { name: string; url: string | null };
  everyone: number;
};

/**
 * PC 가계부 표 한 줄 — 카테고리 타일 28 + 이름 | 항목(배지 · 금액순이면 날 태그 · 메모 아이콘, 아래 예정일 지남이나 연결 일정) |
 * 결제 · 함께 두 줄(아바타 18 — 사진, 없으면 첫 글자 · 각자 냄은 잉크 「각」 + 「정원 결제」, 「함께 · 동규, 서연」) | 결제수단 | 금액(결제 통화 / 원화 환산). 합계에서 뺀 비용은 흐리다
 */
export function ExpenseTableRow({
  row,
  tag,
  selected,
  hasReceipt,
  onSelect,
  onMarkPaid,
  paying,
  mode,
  displayNameOf,
  avatarOf,
  everyone,
}: ExpenseTableRowProps) {
  const amount = amountLines(row, mode);
  const payer = row.splitEach ? null : row.payer;
  const avatarPerson = payer?.person ?? null;
  return (
    // scroll-mt — ↑↓ 로 옮겨 위로 스크롤할 때 붙는 열 머리(38)에 가리지 않게
    <div
      data-expense-id={row.id}
      className={cn(
        // isolate: 「결제 완료」 의 z-10 이 행 안에서만 통하게 — 없으면 위에 붙은 표 머리 위로 올라온다
        "relative isolate scroll-mt-10 py-2.75",
        TABLE_COLUMNS,
        selected ? "bg-surface-selected" : "hover:bg-[#FAFBFC]",
        row.excluded && "opacity-55",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <ExpenseCategoryTile category={row.category} size="sm" />
        <span className="text-[13px] font-semibold text-ink-700">{row.categoryLabel}</span>
      </span>
      <div className="flex min-w-0 flex-col gap-0.75">
        <div className="flex min-w-0 items-center gap-1.5">
          {row.planned && <ExpenseBadge>결제 예정</ExpenseBadge>}
          {tag && (
            <span className="flex h-5 shrink-0 items-center rounded-[5px] bg-surface-muted px-1.5 text-[11px] font-bold text-ink-500">
              {tag}
            </span>
          )}
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className="min-w-0 truncate text-left text-sm font-semibold text-ink-800 after:absolute after:inset-0"
          >
            {row.name}
          </button>
          <NameMarks
            ownerLink={row.ownerLink}
            receipt={hasReceipt}
            memo={row.hasMemo}
            excluded={row.excluded}
          />
        </div>
        {row.overdue ? (
          <span className="flex items-center gap-1.5 text-xs whitespace-nowrap text-status-wait-text">
            예정일 지남
            <button
              type="button"
              onClick={onMarkPaid}
              disabled={paying}
              className="relative z-10 flex h-5 items-center rounded-memo border border-status-wait-line bg-white px-2 text-[11px] font-semibold disabled:opacity-50"
            >
              결제 완료로
            </button>
          </span>
        ) : (
          row.linkName && (
            <span className="flex min-w-0 items-center gap-0.75 text-xs text-ink-400">
              <MapPin className="size-2.75 shrink-0 text-ink-350" aria-hidden="true" />
              <span className="truncate">{row.linkName}</span>
            </span>
          )
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.75">
        <span className="flex min-w-0 items-center gap-1.5">
          {avatarPerson ? (
            <PersonAvatar
              name={displayNameOf(avatarPerson)}
              url={avatarOf(avatarPerson).url}
              guest={avatarPerson.kind === "guest"}
              className="size-4.5"
              fallbackClassName="text-[8px]"
            />
          ) : (
            <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[8px] font-extrabold text-white">
              각
            </span>
          )}
          <span className="truncate text-[13px] font-semibold text-ink-800">
            {payer ? `${displayNameOf(payer.person)} 결제` : "각자 냄"}
          </span>
        </span>
        <span className="truncate pl-6 text-xs text-ink-400">
          {withLine(row, displayNameOf, everyone)}
        </span>
      </div>
      <span className="text-[13px] text-ink-500">{row.methodLabel}</span>
      <div className="flex flex-col items-end gap-0.5">
        <span
          className={cn(
            "text-[15px] font-extrabold",
            row.excluded ? "text-ink-350 line-through" : "text-ink-900",
          )}
        >
          {amount.big}
        </span>
        {amount.small && <span className="text-[11px] text-ink-400">{amount.small}</span>}
      </div>
    </div>
  );
}

type NameMarksProps = {
  /** 「숙소 정보」 · 「항공편 정보」 — 그 결제면 */
  ownerLink: string | null;
  receipt: boolean;
  memo: boolean;
  excluded: boolean;
};

/** 항목명 뒤 표시 — 숙소 · 항공편 연결 · 영수증 클립 · 메모 아이콘 · 「합계 제외」 배지(있는 것만) */
function NameMarks({ ownerLink, receipt, memo, excluded }: NameMarksProps) {
  return (
    <>
      {ownerLink && (
        <Link2 className="size-3.25 shrink-0 text-ink-350" aria-label={`${ownerLink}와 연결됨`} />
      )}
      {receipt && (
        <Paperclip className="size-3.25 shrink-0 text-ink-350" aria-label="영수증 있음" />
      )}
      {memo && <StickyNote className="size-3.25 shrink-0 text-ink-350" aria-label="메모 있음" />}
      {excluded && <ExpenseBadge>합계 제외</ExpenseBadge>}
    </>
  );
}
