import type { CalendarCell, CalendarDay } from "@/shared/lib/calendar";
import { cn } from "@/shared/lib/utils";

const SIZE = {
  // 모바일 세로 스크롤 달력 (시안 5c)
  lg: {
    cell: "h-[62px]",
    band: "top-1 h-[42px]",
    inset: "4px",
    radius: "21px",
    circle: "mt-1 size-[42px] text-[17px]",
    sub: "text-[11px]",
  },
  // PC 두 달 나란히 (시안 6c)
  md: {
    cell: "h-[54px]",
    band: "top-[3px] h-[38px]",
    inset: "3px",
    radius: "19px",
    circle: "mt-[3px] size-[38px] text-[15px]",
    sub: "text-[10px]",
  },
} as const;

type Props = {
  cells: readonly CalendarCell[];
  size: keyof typeof SIZE;
  onPick: (date: string) => void;
  className?: string;
};

/** 한 달 7열 격자. 칸 계산은 shared/lib/calendar 의 monthCells 가 한다. */
export function MonthGrid({ cells, size, onPick, className }: Props) {
  const s = SIZE[size];
  return (
    <div className={cn("grid grid-cols-7", size === "lg" ? "gap-y-1" : "gap-y-0.5", className)}>
      {cells.map((cell, i) =>
        cell.kind === "blank" ? (
          // 달 앞쪽 빈 칸은 위치 말고는 구분할 것이 없고 순서도 바뀌지 않는다
          // eslint-disable-next-line react/no-array-index-key
          <div key={`blank-${i}`} className={s.cell} />
        ) : (
          <DayCell key={cell.date} cell={cell} size={size} onPick={onPick} />
        ),
      )}
    </div>
  );
}

function DayCell({
  cell,
  size,
  onPick,
}: {
  cell: CalendarDay;
  size: keyof typeof SIZE;
  onPick: (date: string) => void;
}) {
  const s = SIZE[size];
  const edge = cell.selected === "start" || cell.selected === "end" || cell.selected === "single";

  const band = bandStyle(cell, s);

  return (
    <button
      type="button"
      disabled={cell.disabled}
      onClick={() => onPick(cell.date)}
      aria-label={cell.date}
      aria-pressed={edge}
      className={cn("relative flex flex-col items-center disabled:cursor-default", s.cell)}
    >
      {band && <span aria-hidden="true" className={cn("absolute", s.band)} style={band} />}
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full",
          s.circle,
          dayTone(cell, edge),
        )}
      >
        {cell.day}
      </span>
      {cell.label && (
        <span
          className={cn(
            "relative font-semibold whitespace-nowrap",
            s.sub,
            cell.label === "다른 일정" ? "text-ink-350" : "text-primary",
          )}
        >
          {cell.label}
        </span>
      )}
    </button>
  );
}

/** 날짜 숫자 색. 출발·도착 원 > 지난 날(막힘) > 오늘 > 주말·공휴일 > 평일 */
function dayTone(cell: CalendarDay, edge: boolean) {
  if (edge) return "bg-primary font-bold text-white";
  if (cell.disabled) return "font-medium text-[#C9CDD2]";
  if (cell.today) return "font-bold text-primary";
  if (cell.red) return "font-medium text-destructive";
  return "font-medium text-ink-800";
}

/** 칸 뒤의 띠. 고른 기간의 띠가 다른 일정의 띠보다 위다. 띠가 없으면 null */
function bandStyle(cell: CalendarDay, s: (typeof SIZE)[keyof typeof SIZE]) {
  if (cell.selected === "single") return null;
  if (cell.selected) {
    return {
      left: cell.selected === "start" ? "50%" : 0,
      right: cell.selected === "end" ? "50%" : 0,
      backgroundColor: "var(--color-primary-tint)",
    } satisfies React.CSSProperties;
  }
  if (!cell.other) return null;
  const start = cell.other.roundStart ? s.radius : 0;
  const end = cell.other.roundEnd ? s.radius : 0;
  return {
    left: cell.other.roundStart ? s.inset : 0,
    right: cell.other.roundEnd ? s.inset : 0,
    borderRadius: `${start} ${end} ${end} ${start}`,
    backgroundColor: "#EEEFF1",
  } satisfies React.CSSProperties;
}
