"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { CityPicker, CityThumb, useCityCatalog } from "@/entities/city";
import { useTrips } from "@/entities/trip";
import { type DateRange, monthCells, monthsAround } from "@/shared/lib/calendar";
import { todayISO } from "@/shared/lib/days";
import { isHoliday } from "@/shared/lib/holidays";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { MonthGrid } from "@/shared/ui/month-grid";
import { cityCtaLabel, dateCtaLabel } from "../lib/cta";
import type { TripCreateState } from "../model/use-trip-create";

type Layout = "mobile" | "pc";
type TitleComponent = React.ComponentType<{ className?: string; children: React.ReactNode }>;

type Props = {
  /** mobile = 전체 화면(5b·5c), pc = 760×660 모달 안(6b·6c). 크기는 감싸는 쪽이 정한다. */
  layout: Layout;
  /** useTripCreate 의 상태. 감싸는 화면이 들고 있어 레이아웃이 바뀌어도 이어진다. */
  state: TripCreateState;
  onClose: () => void;
  /** 감싸는 쪽의 제목 컴포넌트. 다이얼로그면 DialogTitle 을 넘겨 접근성 이름을 잇는다. */
  Title?: TitleComponent;
};

/**
 * 고를 수 있는 달. 지난 여행도 기록할 수 있게 3년 전부터 연다(시안 수정 모드와 같은 범위).
 * 모바일은 세로로 이어 그리고 이번 달로 스크롤해 둔다. PC 는 이번 달부터 두 달씩 넘긴다.
 */
const PAST_MONTHS = 36;
const FUTURE_MONTHS = 11;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 새 여행 만들기: 도시 다중 선택 → 출발·도착일 → 생성 */
export function TripCreateFlow({ layout, state, onClose, Title = DefaultTitle }: Props) {
  const { data: catalog, error: catalogError } = useCityCatalog();
  const { data: trips } = useTrips();
  const { step, query, setQuery, picked, toggle, goDate, backToCity, selection, pick, submit } =
    state;
  const create = state.create;

  const today = todayISO();
  // 지난 날짜도 고를 수 있으니 지난 여행까지 「다른 일정」으로 깐다
  const others = useMemo<DateRange[]>(
    () => (trips ?? []).map((t) => ({ start: t.start_date, end: t.end_date })),
    [trips],
  );
  const months = useMemo(() => monthsAround(today, PAST_MONTHS, FUTURE_MONTHS), [today]);
  const names = picked.map((c) => c.name);

  // 모바일 달력은 지난 달부터 그리므로, 날짜 단계에 들어오면 이번 달로 스크롤해 둔다
  const thisMonthRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (layout !== "mobile" || step !== "date") return;
    const scroll = () => thisMonthRef.current?.scrollIntoView({ block: "start" });
    scroll();
    // PC 폭에서 날짜 단계에 들어오면 이 달력은 숨겨져(display:none) 스크롤이 먹지 않는다.
    // 창이 좁아져(태블릿 회전) 보이게 되는 순간 다시 이번 달로 맞춘다. lg = 1024px
    const wide = window.matchMedia("(min-width: 1024px)");
    const onChange = () => !wide.matches && scroll();
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [layout, step]);
  const cellsOf = (year: number, month: number) =>
    monthCells(year, month, { today, selection, others, isHoliday, allowPast: true });
  const ready = Boolean(selection?.end);
  const dateCta = create.isPending ? "만드는 중…" : dateCtaLabel(selection);
  const error = create.error && (
    <p className="text-sm text-destructive">여행을 만들지 못했어요: {create.error.message}</p>
  );

  const cityBody = catalog ? (
    <CityPicker
      catalog={catalog}
      query={query}
      selected={picked.map((c) => c.id)}
      onToggle={toggle}
      layout={layout}
    />
  ) : (
    <p className="flex flex-1 items-center justify-center text-sm text-ink-400">
      {catalogError ? "도시 목록을 불러오지 못했어요" : "도시를 불러오는 중…"}
    </p>
  );

  const searchInput = (className: string) => (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="여행, 어디로 떠나시나요?"
      aria-label="도시 검색"
      className={cn(
        "min-w-0 flex-1 bg-transparent text-ink-900 outline-none placeholder:text-ink-350",
        className,
      )}
    />
  );

  if (layout === "mobile") {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        {step === "city" ? (
          <>
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-surface-muted px-[18px]">
              <IconButton
                label="닫기"
                onClick={onClose}
                disabled={state.locked}
                className="text-ink-900"
              >
                <ArrowLeft className="size-6" strokeWidth={2} />
              </IconButton>
              <Title className="sr-only">어디로 떠나시나요?</Title>
              {searchInput("text-[17px]")}
              <Search className="size-[22px] shrink-0 text-ink-700" />
            </div>
            {cityBody}
            <MobileFooter>
              {picked.length > 0 && (
                <div className="flex gap-3.5 overflow-x-auto pt-1.5">
                  {picked.map((city) => (
                    <div
                      key={city.id}
                      className="relative flex shrink-0 flex-col items-center gap-1"
                    >
                      <CityThumb city={city} size={44} />
                      <IconButton
                        label={`${city.name} 빼기`}
                        onClick={() => toggle(city)}
                        className="absolute -top-1.5 -right-2 size-[22px] rounded-full border border-line bg-white text-ink-500"
                      >
                        <X className="size-3" strokeWidth={2.4} />
                      </IconButton>
                      <span className="text-xs text-ink-500">{city.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <Button size="cta" className="w-full" disabled={picked.length === 0} onClick={goDate}>
                {cityCtaLabel(names)}
              </Button>
            </MobileFooter>
          </>
        ) : (
          <>
            <div className="flex shrink-0 flex-col gap-2.5 border-b border-divider px-5 pt-1.5 pb-4">
              <IconButton
                label="도시 다시 고르기"
                onClick={backToCity}
                disabled={state.locked}
                className="self-start py-2 text-ink-900"
              >
                <X className="size-6" strokeWidth={2} />
              </IconButton>
              <Title className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
                여행일정 등록
              </Title>
              <p className="text-[15px] leading-normal text-ink-500">
                {names.join("·")} · 날짜에 맞춰 날씨와 여행 정보를 알려드려요.
              </p>
            </div>
            <Weekdays className="shrink-0 border-b border-surface-muted bg-[#FAFAFB] py-2.5 text-[13px]" />
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#FAFAFB]">
              {months.map(([year, month], i) => (
                <div
                  key={`${year}-${month}`}
                  ref={i === PAST_MONTHS ? thisMonthRef : undefined}
                  className="pt-5 pb-2"
                >
                  <h3 className="px-5 pb-2.5 text-base font-bold text-ink-800">
                    {year}년 {month}월
                  </h3>
                  <MonthGrid size="lg" cells={cellsOf(year, month)} onPick={pick} />
                </div>
              ))}
            </div>
            <MobileFooter>
              {error}
              <Button
                size="cta"
                className="w-full"
                disabled={!ready || create.isPending}
                onClick={submit}
              >
                {dateCta}
              </Button>
            </MobileFooter>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex shrink-0 items-center gap-3 px-7 pt-[22px] pb-3.5">
        {step === "date" && (
          <IconButton
            label="도시 다시 고르기"
            onClick={backToCity}
            disabled={state.locked}
            className="text-ink-900"
          >
            <ArrowLeft className="size-[22px]" strokeWidth={2} />
          </IconButton>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <Title className="text-[22px] font-extrabold tracking-[-0.02em] text-ink-900">
            {step === "city" ? "어디로 떠나시나요?" : "여행일정 등록"}
          </Title>
          <p className="text-sm text-ink-400">
            {step === "city"
              ? "여러 도시를 함께 고를 수 있어요."
              : "날짜에 맞춰 날씨와 여행 정보를 알려드려요."}
          </p>
        </div>
        <span className="text-[13px] font-bold text-ink-400">
          {step === "city" ? "1 / 2" : "2 / 2"}
        </span>
        <IconButton label="닫기" onClick={onClose} disabled={state.locked} className="text-ink-400">
          <X className="size-6" strokeWidth={2} />
        </IconButton>
      </div>

      {step === "city" ? (
        <>
          <div className="shrink-0 px-7">
            <div className="flex h-[46px] items-center gap-2 rounded-card bg-surface-muted px-3.5">
              <Search className="size-5 shrink-0 text-ink-400" />
              {searchInput("text-[15px]")}
            </div>
          </div>
          {cityBody}
        </>
      ) : (
        <PcCalendar months={months} cellsOf={cellsOf} onPick={pick} />
      )}

      {error && <div className="shrink-0 px-7 pb-2">{error}</div>}
      <div className="flex shrink-0 items-center gap-4 border-t border-divider px-7 pt-3.5 pb-[18px]">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {picked.length === 0 ? (
            <span className="text-[13px] text-ink-350">도시를 1개 이상 골라 주세요</span>
          ) : (
            picked.map((city) =>
              step === "city" ? (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => toggle(city)}
                  aria-label={`${city.name} 빼기`}
                  className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-surface-muted pr-2 pl-1"
                >
                  <CityThumb city={city} size={24} />
                  <span className="text-[13px] font-bold text-ink-800">{city.name}</span>
                  <X className="size-3.5 text-ink-450" strokeWidth={2.4} />
                </button>
              ) : (
                <span
                  key={city.id}
                  className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-surface-muted pr-2.5 pl-1"
                >
                  <CityThumb city={city} size={24} />
                  <span className="text-[13px] font-bold text-ink-800">{city.name}</span>
                </span>
              ),
            )
          )}
        </div>
        {step === "city" ? (
          <Button
            size="cta"
            className="w-[280px] shrink-0"
            disabled={picked.length === 0}
            onClick={goDate}
          >
            {picked.length > 0 ? "다음 · 날짜 선택" : "최소 1개 도시 선택"}
          </Button>
        ) : (
          <Button
            size="cta"
            className="w-[280px] shrink-0"
            disabled={!ready || create.isPending}
            onClick={submit}
          >
            {dateCta}
          </Button>
        )}
      </div>
    </div>
  );
}

function DefaultTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h1 className={className}>{children}</h1>;
}

function MobileFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-divider bg-white px-5 pt-3 pb-[calc(34px+env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}

function Weekdays({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-7", className)}>
      {WEEKDAYS.map((label, i) => (
        <span
          key={label}
          className={cn("text-center", i === 0 || i === 6 ? "text-destructive" : "text-ink-400")}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

/** PC: 두 달 나란히, ◀▶ 로 넘긴다. 처음엔 이번 달부터 보인다 (시안 6c) */
function PcCalendar({
  months,
  cellsOf,
  onPick,
}: {
  months: readonly [number, number][];
  cellsOf: (year: number, month: number) => ReturnType<typeof monthCells>;
  onPick: (date: string) => void;
}) {
  const [offset, setOffset] = useState(PAST_MONTHS);
  const shown = months.slice(offset, offset + 2);
  const last = months.length - 2;
  return (
    <div className="flex min-h-0 flex-1 flex-col px-7 pt-1">
      <div className="flex shrink-0 items-center gap-4 pb-2.5 text-xs text-ink-400">
        <span className="flex items-center gap-1.5">
          <span className="size-3.5 rounded-full bg-primary" />
          출발 · 도착
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-[22px] rounded-[5px] bg-[#EEEFF1]" />
          다른 일정
        </span>
        <IconButton
          label="이전 달"
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          disabled={offset === 0}
          className="ml-auto size-8 rounded-full border border-line text-ink-700 disabled:opacity-35"
        >
          <ChevronLeft className="size-[18px]" />
        </IconButton>
        <IconButton
          label="다음 달"
          onClick={() => setOffset((o) => Math.min(last, o + 1))}
          disabled={offset === last}
          className="size-8 rounded-full border border-line text-ink-700 disabled:opacity-35"
        >
          <ChevronRight className="size-[18px]" />
        </IconButton>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-8">
        {shown.map(([year, month]) => (
          <div key={`${year}-${month}`} className="flex flex-col gap-1.5">
            <h3 className="pb-1 text-center text-base font-extrabold text-ink-900">
              {year}년 {month}월
            </h3>
            <Weekdays className="pb-1.5 text-xs" />
            <MonthGrid size="md" cells={cellsOf(year, month)} onPick={onPick} />
          </div>
        ))}
      </div>
    </div>
  );
}
