import { describe, expect, it } from "vitest";

import {
  type CalendarDay,
  monthCells,
  monthsFrom,
  monthsSpanning,
  pickDate,
  rangeCtaLabel,
} from "./calendar";

const TODAY = "2026-10-03";
const days = (cells: ReturnType<typeof monthCells>) =>
  cells.filter((c): c is CalendarDay => c.kind === "day");
const at = (cells: ReturnType<typeof monthCells>, date: string) =>
  days(cells).find((c) => c.date === date)!;

describe("monthCells", () => {
  it("일요일 시작에 맞춰 앞을 비운다", () => {
    // 2026-10-01 은 목요일
    const cells = monthCells(2026, 10, { today: TODAY, selection: null, others: [] });
    expect(cells.slice(0, 4).every((c) => c.kind === "blank")).toBe(true);
    expect(days(cells)).toHaveLength(31);
  });

  it("지난 날짜는 막고, 수정 모드에서는 연다", () => {
    const base = { today: TODAY, selection: null, others: [] };
    expect(at(monthCells(2026, 10, base), "2026-10-02").disabled).toBe(true);
    expect(at(monthCells(2026, 10, base), "2026-10-03").disabled).toBe(false);
    expect(at(monthCells(2026, 10, { ...base, allowPast: true }), "2026-10-02").disabled).toBe(
      false,
    );
  });

  it("주말과 공휴일은 빨갛다", () => {
    const cells = monthCells(2026, 10, {
      today: TODAY,
      selection: null,
      others: [],
      isHoliday: (d) => d === "2026-10-09",
    });
    expect(at(cells, "2026-10-04").red).toBe(true); // 일
    expect(at(cells, "2026-10-09").red).toBe(true); // 한글날(금)
    expect(at(cells, "2026-10-08").red).toBe(false);
  });

  it("고른 기간의 위치와 라벨", () => {
    const cells = monthCells(2026, 10, {
      today: TODAY,
      selection: { start: "2026-10-20", end: "2026-10-22" },
      others: [],
    });
    expect(at(cells, "2026-10-20")).toMatchObject({ selected: "start", label: "출발" });
    expect(at(cells, "2026-10-21")).toMatchObject({ selected: "middle", label: null });
    expect(at(cells, "2026-10-22")).toMatchObject({ selected: "end", label: "도착" });
  });

  it("출발만 골랐으면 한 칸짜리이고 도착 라벨이 없다", () => {
    const cells = monthCells(2026, 10, {
      today: TODAY,
      selection: { start: "2026-10-20", end: null },
      others: [],
    });
    expect(at(cells, "2026-10-20")).toMatchObject({ selected: "single", label: "출발" });
  });

  it("다른 일정의 띠는 시작·끝과 주 경계에서 둥글다", () => {
    // 10/24(토) ~ 10/26(월)
    const cells = monthCells(2026, 10, {
      today: TODAY,
      selection: null,
      others: [{ start: "2026-10-24", end: "2026-10-26" }],
    });
    expect(at(cells, "2026-10-24")).toMatchObject({
      other: { roundStart: true, roundEnd: true },
      label: "다른 일정",
    });
    expect(at(cells, "2026-10-25").other).toEqual({ roundStart: true, roundEnd: false });
    expect(at(cells, "2026-10-26").other).toEqual({ roundStart: false, roundEnd: true });
  });

  it("오늘 라벨보다 고른 기간 라벨이 우선한다", () => {
    const cells = monthCells(2026, 10, {
      today: TODAY,
      selection: { start: TODAY, end: null },
      others: [],
    });
    expect(at(cells, TODAY)).toMatchObject({ today: true, label: "출발" });
  });
});

describe("monthCells — 숙박 날짜", () => {
  it("여행 기간은 점으로, 양 끝 라벨은 체크인 · 체크아웃", () => {
    const cells = monthCells(2026, 10, {
      today: TODAY,
      selection: { start: "2026-10-20", end: "2026-10-22" },
      others: [],
      allowPast: true,
      marked: { start: "2026-10-21", end: "2026-10-23" },
      labels: { start: "체크인", end: "체크아웃" },
    });
    expect(at(cells, "2026-10-20").label).toBe("체크인");
    expect(at(cells, "2026-10-22").label).toBe("체크아웃");
    expect(
      days(cells)
        .filter((c) => c.mark)
        .map((c) => c.day),
    ).toEqual([21, 22, 23]);
    expect(at(cells, "2026-10-20").mark).toBe(false);
  });
});

describe("pickDate", () => {
  it("처음 누르면 출발", () => {
    expect(pickDate(null, "2026-10-20")).toEqual({ start: "2026-10-20", end: null });
  });

  it("출발 뒤를 누르면 도착", () => {
    expect(pickDate({ start: "2026-10-20", end: null }, "2026-10-22")).toEqual({
      start: "2026-10-20",
      end: "2026-10-22",
    });
  });

  it("출발 앞을 누르면 새 출발", () => {
    expect(pickDate({ start: "2026-10-20", end: null }, "2026-10-18")).toEqual({
      start: "2026-10-18",
      end: null,
    });
  });

  it("출발일을 다시 누르면 당일치기", () => {
    expect(pickDate({ start: "2026-10-20", end: null }, "2026-10-20")).toEqual({
      start: "2026-10-20",
      end: "2026-10-20",
    });
  });

  it("숙박 날짜(minNights 1)는 같은 날을 다시 눌러도 끝이 되지 않는다", () => {
    expect(pickDate({ start: "2026-10-20", end: null }, "2026-10-20", { minNights: 1 })).toEqual({
      start: "2026-10-20",
      end: null,
    });
    expect(pickDate({ start: "2026-10-20", end: null }, "2026-10-21", { minNights: 1 })).toEqual({
      start: "2026-10-20",
      end: "2026-10-21",
    });
  });

  it("둘 다 고른 뒤 누르면 새 출발", () => {
    expect(pickDate({ start: "2026-10-20", end: "2026-10-22" }, "2026-10-25")).toEqual({
      start: "2026-10-25",
      end: null,
    });
  });
});

describe("monthsSpanning", () => {
  it("오늘과 기준 달을 모두 담고 기준 달에서 시작한다", () => {
    // 2025-01 에 시작한 여행을 2026-10 에 고친다: 오늘 이후로도 옮길 수 있어야 한다
    const { months, focusIndex } = monthsSpanning("2025-01-10", "2026-10-03", 2, 1);
    expect(months[0]).toEqual([2024, 11]);
    expect(months.at(-1)).toEqual([2026, 11]);
    expect(months[focusIndex]).toEqual([2025, 1]);
  });

  it("기준이 오늘보다 뒤여도 같다", () => {
    const { months, focusIndex } = monthsSpanning("2027-03-01", "2026-10-03", 1, 1);
    expect(months[0]).toEqual([2026, 9]);
    expect(months.at(-1)).toEqual([2027, 4]);
    expect(months[focusIndex]).toEqual([2027, 3]);
  });
});

describe("monthsFrom", () => {
  it("해를 넘긴다", () => {
    expect(monthsFrom("2026-11-15", 3)).toEqual([
      [2026, 11],
      [2026, 12],
      [2027, 1],
    ]);
  });
});

describe("rangeCtaLabel", () => {
  it("단계마다 다음 할 일을 알려 주고, 다 고르면 기간과 완료 동작", () => {
    expect(rangeCtaLabel(null, "수정 완료")).toBe("출발일을 선택해 주세요");
    expect(rangeCtaLabel({ start: "2026-11-06", end: null }, "수정 완료")).toBe(
      "도착일을 선택해 주세요",
    );
    expect(rangeCtaLabel({ start: "2026-11-06", end: "2026-11-08" }, "수정 완료")).toBe(
      "2026.11.6 - 11.8 / 수정 완료",
    );
  });
});
