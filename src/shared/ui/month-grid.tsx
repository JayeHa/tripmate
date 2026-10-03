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
          <div key={`b${i}`} className={s.cell} />
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

  // 고른 기간의 띠가 다른 일정의 띠보다 위다
  let band: React.CSSProperties | null = null;
  if (cell.selected && cell.selected !== "single") {
    band = {
      left: cell.selected === "start" ? "50%" : 0,
      right: cell.selected === "end" ? "50%" : 0,
      backgroundColor: "var(--color-primary-tint)",
    };
  } else if (cell.other && !cell.selected) {
    const { roundStart, roundEnd } = cell.other;
    band = {
      left: roundStart ? s.inset : 0,
      right: roundEnd ? s.inset : 0,
      borderRadius: `${roundStart ? s.radius : 0} ${roundEnd ? s.radius : 0} ${roundEnd ? s.radius : 0} ${roundStart ? s.radius : 0}`,
      backgroundColor: "#EEEFF1",
    };
  }

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
          edge
            ? "bg-primary font-bold text-white"
            : cell.disabled
              ? "font-medium text-[#C9CDD2]"
              : cell.today
                ? "font-bold text-primary"
                : cell.red
                  ? "font-medium text-destructive"
                  : "font-medium text-ink-800",
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
