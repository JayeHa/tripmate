import { ChevronRight } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { InfoKey, InfoRow } from "../lib/info-rows";
import { SettingsCard } from "./settings-card";

type TripInfoCardProps = {
  rows: InfoRow[];
  /** 누를 수 있는 줄과 그 동작. 없는 줄은 읽기만 */
  actions: Partial<Record<InfoKey, () => void>>;
};

/** 여행 정보 카드 — 이름 · 도시 · 기간 · 기준 화폐 · 환율 표. 누를 수 있는 줄은 오른쪽 「›」 */
export function TripInfoCard({ rows, actions }: TripInfoCardProps) {
  return (
    <SettingsCard title="여행 정보" className="gap-4">
      <div className="flex flex-col">
        {rows.map((row) => (
          <InfoLine key={row.key} row={row} onOpen={actions[row.key]} />
        ))}
      </div>
    </SettingsCard>
  );
}

type InfoLineProps = { row: InfoRow; onOpen: (() => void) | undefined };

/** 한 줄 — 라벨 72 · 14 회색, 값 15/600(여러 줄이면 줄마다) */
function InfoLine({ row, onOpen }: InfoLineProps) {
  const body = (
    <>
      <span className="w-18 shrink-0 text-sm/normal text-ink-400">{row.label}</span>
      <span
        className={cn(
          "min-w-0 flex-1 text-[15px]/normal font-semibold wrap-break-word whitespace-pre-line",
          row.empty ? "text-ink-350" : "text-ink-900",
        )}
      >
        {row.value}
      </span>
    </>
  );
  const line =
    "flex w-full gap-3 border-t border-surface-muted py-2.75 text-left lg:gap-4 lg:py-3.25";
  if (!onOpen) return <div className={line}>{body}</div>;
  return (
    <button type="button" onClick={onOpen} className={cn(line, "cursor-pointer items-start")}>
      {body}
      <ChevronRight className="mt-0.5 size-4.5 shrink-0 text-ink-350" aria-hidden="true" />
    </button>
  );
}
