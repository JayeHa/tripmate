import { CategoryThumb, type ScheduleItem, ScheduleLinkField } from "@/entities/schedule-item";

import { linkGroups } from "../lib/link-items";
import type { ExpenseLink } from "../model/use-expense-link";
import { RelinkDialog } from "./relink-dialog";

type LinkFieldProps = {
  link: ExpenseLink;
  startDate: string;
  items: ScheduleItem[];
  alternatives: ScheduleItem[];
  /** 지금 날짜(0 부터) — 고르기 창의 날짜 필터 처음 값. 여행준비면 null */
  dayIndex: number | null;
};

/**
 * 일정 연결(선택) — 고르면 날짜 · 카테고리 · 항목명이 채워진다. 칸은 공용 ScheduleLinkField(P34).
 * ✕ 는 「아직 안 고름」 으로, 창의 「연결 안 함」 은 연결하지 않기로 고른 것으로 남긴다.
 * 이미 연결된 비용을 다른 일정으로 바꾸면 「값도 바꾸기 / 연결만 바꾸기」 를 묻는다(RelinkDialog)
 */
export function LinkField({ link, startDate, items, alternatives, dayIndex }: LinkFieldProps) {
  const groups = linkGroups(startDate, items, alternatives).map((g) => ({
    ...g,
    items: g.items.map((item) => ({
      ...item,
      thumb: <CategoryThumb category={item.thumbCategory} size="sm" />,
    })),
  }));
  const byId = new Map([...items, ...alternatives].map((i) => [i.id, i]));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold text-ink-900">
          일정 연결 <span className="font-medium text-ink-350">(선택)</span>
        </span>
        <span className="text-xs text-ink-400">
          고르면 날짜·카테고리·항목명이 자동으로 채워져요
        </span>
      </div>
      <ScheduleLinkField
        value={link.itemId || null}
        onChange={(id) => {
          const item = id ? byId.get(id) : undefined;
          if (item) link.pick(item);
          else link.chooseNone();
        }}
        onClear={link.clear}
        groups={groups}
        defaultDay={dayIndex === null ? null : String(dayIndex)}
        placeholder={link.status === "none" ? "연결 안 함" : "어느 일정에서 쓴 돈인가요?"}
      />
      {link.gone && (
        <p className="text-xs font-semibold text-status-wait-text">
          연결했던 일정이 지워졌어요. 다른 일정을 고르거나 그대로 저장하세요
        </p>
      )}
      <RelinkDialog link={link} />
    </div>
  );
}
