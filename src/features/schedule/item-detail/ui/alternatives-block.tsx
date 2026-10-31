"use client";

import { useState } from "react";

import { linkedChecklistCount, useChecklistIndex } from "@/entities/checklist";
import { useExpenses } from "@/entities/expense";
import {
  itemCoords,
  itemName,
  type PlaceCategory,
  type ReservationStatus,
  type ScheduleItem,
  useMemos,
  useScheduleItems,
} from "@/entities/schedule-item";
import { linkedVoucherCount, useVouchers } from "@/entities/voucher";
import { CircleAddButton } from "@/shared/ui/add-controls";

import { altPins, neighborPins } from "../lib/alt-map";
import { linkedExpensesOf } from "../lib/alternatives";
import type { AlternativeActions } from "../model/use-alternative-actions";
import { AlternativeCard } from "./alternative-card";
import { AlternativesMap } from "./alternatives-map";
import { AlternativesMapDialog } from "./alternatives-map-dialog";

type AlternativesBlockProps = {
  tripId: string;
  main: ScheduleItem;
  /** 지금 장소 핀(일정의 번호 · 예약 상태 · 카테고리) — 미니 지도에 그대로 */
  mainPin: { num: number | null; status: ReservationStatus | null; category: PlaceCategory | null };
  alternatives: ScheduleItem[];
  actions: AlternativeActions;
  /** 제목 오른쪽 「+」 — 부른 쪽이 「대체 장소 추가」 창을 연다 */
  onAdd: () => void;
  /** 카드를 누르면 그 대체 장소의 상세(메모 · 예약 상태를 바꾸기 없이 보고 고친다) */
  onOpen: (alt: ScheduleItem) => void;
};

/**
 * 대체 장소 — 이 일정이 안 될 때 갈 곳. 「대체 장소 N」 + 회색 원 「+」(「대체 장소 추가」 창), 카드마다 이름 · 설명(누르면 그 대체 장소의 상세) · 「바꾸기」 · 빼기.
 * 지금 장소와 대체 장소 하나 이상에 좌표가 있으면 제목 아래 미니 지도(P42) — 카드 · 핀을 누르면 그 장소를 고른다.
 * 미니 지도의 「크게 보기」 는 전체 화면 지도를 열고, 거기엔 같은 날 앞뒤 일정 핀도 보인다(고른 핀은 두 지도가 함께 쓴다).
 * 대체 장소가 없으면 칸을 그리지 않는다(맨 아래 「추가」 줄의 칩으로 연다).
 * 바꾸기는 그 장소가 이 자리(날짜 · 순서 · 시간)에 들어가고, 예약 상태 · 메모는 각자 장소를 따라간다
 */
export function AlternativesBlock({
  tripId,
  main,
  mainPin,
  alternatives,
  actions,
  onAdd,
  onOpen,
}: AlternativesBlockProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { data: items = [] } = useScheduleItems(tripId);
  const { data: memos = [] } = useMemos(tripId);
  /** 그 대체 장소 줄에 붙은 메모 수 — 빼기 전에 물을지 정한다 */
  const memoCount = (id: string) => memos.filter((m) => m.schedule_item_id === id).length;
  const { data: expenses = [] } = useExpenses(tripId);
  const checklist = useChecklistIndex(tripId);
  const { data: vouchers = [] } = useVouchers(tripId);
  if (alternatives.length === 0) return null;
  const pins = altPins(main, alternatives);
  const current = itemCoords(main);
  /** 카드 누르기 — 고르기, 이미 골랐으면 풀기(지금 장소로) */
  const toggle = (id: string) => setSelectedId((cur) => (cur === id ? null : id));
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink-400">대체 장소 {alternatives.length}</span>
        <CircleAddButton label="대체 장소 추가" onClick={onAdd} />
      </div>
      {current && pins.length > 0 && (
        <>
          <AlternativesMap
            current={{ at: current, ...mainPin }}
            pins={pins}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onExpand={() => setExpanded(true)}
          />
          <AlternativesMapDialog
            open={expanded}
            onClose={() => setExpanded(false)}
            mainName={itemName(main)}
            map={{
              current: { at: current, ...mainPin },
              pins,
              selectedId,
              onSelect: setSelectedId,
              neighbors: neighborPins(items, main),
            }}
          />
        </>
      )}
      {alternatives.map((alt) => (
        <AlternativeCard
          key={alt.id}
          main={main}
          alt={alt}
          memoCount={memoCount(alt.id)}
          linkedExpenses={linkedExpensesOf(expenses, alt.id)}
          checklistCount={linkedChecklistCount(checklist, [alt.id])}
          voucherCount={linkedVoucherCount(vouchers, [alt.id])}
          actions={actions}
          onOpen={() => onOpen(alt)}
          pin={pins.find((p) => p.alt.id === alt.id) ?? null}
          selected={selectedId === alt.id}
          onToggle={() => toggle(alt.id)}
        />
      ))}
    </section>
  );
}
