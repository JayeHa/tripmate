import { CalendarDays, ChevronRight, CircleSlash, MapPin, X } from "lucide-react";
import { useState } from "react";

import { itemName, type ScheduleItem } from "@/entities/schedule-item";

import type { ExpenseLink } from "../model/use-expense-link";
import { LinkSheet } from "./link-sheet";
import { RelinkDialog } from "./relink-dialog";

type LinkFieldProps = {
  link: ExpenseLink;
  items: ScheduleItem[];
  alternatives: ScheduleItem[];
  /** 일정마다 이미 연결된 비용의 합(기준 화폐) */
  costs: Map<string, number>;
  home: string;
  /** 지금 날짜(0 부터) — 고르기 시트의 날짜 필터 처음 값. 여행준비면 null */
  dayIndex: number | null;
};

/**
 * 일정 연결(선택) — 고르면 날짜 · 카테고리 · 항목명이 채워진다. 칸은 세 모양:
 * 아직 안 고름(블루 「어느 일정에서 쓴 돈인가요? ›」) · 「연결 안 함」(회색 + 「일정 고르기」) · 연결됨(day 배지 + 이름 + ✕)
 */
export function LinkField({ link, items, alternatives, costs, home, dayIndex }: LinkFieldProps) {
  const [open, setOpen] = useState(false);
  const openSheet = () => setOpen(true);
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
      {link.status === "linked" && (
        <div className="flex h-12.5 items-center gap-2 rounded-card border-[1.5px] border-primary bg-brand-faint pr-1.5 pl-3.5">
          <MapPin className="size-4.25 shrink-0 text-primary" aria-hidden="true" />
          <button
            type="button"
            onClick={openSheet}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span className="flex h-5.5 shrink-0 items-center rounded-[5px] bg-primary px-1.75 text-xs font-extrabold text-white">
              {link.linked ? `day ${link.linked.day_index + 1}` : "일정"}
            </span>
            <span className="truncate text-base font-bold text-ink-900">
              {link.linked ? itemName(link.linked) : "찾을 수 없는 일정"}
            </span>
          </button>
          <button
            type="button"
            aria-label="일정 연결 지우기"
            onClick={link.clear}
            className="flex size-7 shrink-0 items-center justify-center text-ink-400"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
      {link.status === "none" && (
        <button
          type="button"
          onClick={openSheet}
          className="flex h-12.5 items-center gap-2 rounded-card border border-input bg-white px-3.5 text-left text-[15px] font-semibold text-ink-500"
        >
          <CircleSlash className="size-4.25 text-ink-400" aria-hidden="true" />
          <span className="flex-1">연결 안 함</span>
          <span className="text-[13px] font-bold text-primary">일정 고르기</span>
        </button>
      )}
      {link.status === "prompt" && (
        <button
          type="button"
          onClick={openSheet}
          className="flex h-12.5 items-center gap-2 rounded-card border-[1.5px] border-brand-line bg-brand-faint px-3.5 text-left text-[15px] font-bold text-brand-text"
        >
          <CalendarDays className="size-4.5 text-primary" aria-hidden="true" />
          <span className="flex-1">어느 일정에서 쓴 돈인가요?</span>
          <ChevronRight className="size-4.5 text-primary" aria-hidden="true" />
        </button>
      )}
      <LinkSheet
        open={open}
        onClose={() => setOpen(false)}
        link={link}
        items={items}
        alternatives={alternatives}
        costs={costs}
        home={home}
        startDay={link.linked?.day_index ?? dayIndex}
      />
      <RelinkDialog link={link} />
    </div>
  );
}
