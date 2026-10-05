import { describe, expect, it } from "vitest";

import {
  dateFieldLabel,
  monthOf,
  nightsLabel,
  pickerCells,
  rangeFieldLabel,
  rangeHint,
  shiftMonth,
} from "./date-field";

describe("dateFieldLabel · rangeFieldLabel · nightsLabel", () => {
  it("날짜 칸 「2026.10.28 (수)」", () => {
    expect(dateFieldLabel("2026-10-28")).toBe("2026.10.28 (수)");
  });

  it("기간 칸은 끝 날짜를 짧게, 해가 바뀌면 연도를 붙인다", () => {
    expect(rangeFieldLabel("2026-10-31", "2026-11-04")).toBe("2026.10.31 (토) – 11.04");
    expect(rangeFieldLabel("2026-12-30", "2027-01-02")).toBe("2026.12.30 (수) – 2027.01.02");
  });

  it("「4박 5일」, 당일은 「0박 1일」", () => {
    expect(nightsLabel("2026-10-31", "2026-11-04")).toBe("4박 5일");
    expect(nightsLabel("2026-10-31", "2026-10-31")).toBe("0박 1일");
  });
});

describe("rangeHint", () => {
  it("시작일 → 종료일 → 고른 기간", () => {
    expect(rangeHint(null)).toEqual({ text: "시작일을 선택해 주세요", done: false });
    expect(rangeHint({ start: "2026-10-31", end: null })).toEqual({
      text: "종료일을 선택해 주세요",
      done: false,
    });
    expect(rangeHint({ start: "2026-10-31", end: "2026-11-04" })).toEqual({
      text: "10.31 – 11.04 · 4박 5일",
      done: true,
    });
  });
});

describe("monthOf · shiftMonth", () => {
  it("달을 넘기면 해도 넘어간다", () => {
    expect(monthOf("2026-12-15")).toEqual([2026, 12]);
    expect(shiftMonth([2026, 12], 1)).toEqual([2027, 1]);
    expect(shiftMonth([2026, 1], -1)).toEqual([2025, 12]);
  });
});

describe("pickerCells", () => {
  const days = (cells: ReturnType<typeof pickerCells>) =>
    cells.flatMap((c) => (c.kind === "day" ? [c] : []));

  it("지난 날짜도 고를 수 있고, min 보다 앞만 막는다 — 라벨은 없다", () => {
    const cells = days(
      pickerCells([2026, 10], { today: "2026-10-15", selection: null, min: "2026-10-10" }),
    );
    expect(cells.find((c) => c.date === "2026-10-09")?.disabled).toBe(true);
    expect(cells.find((c) => c.date === "2026-10-10")?.disabled).toBe(false);
    expect(cells.find((c) => c.date === "2026-10-12")?.disabled).toBe(false);
    expect(cells.every((c) => c.label === null)).toBe(true);
    expect(cells.find((c) => c.date === "2026-10-15")?.today).toBe(true);
  });

  it("고른 기간의 위치를 표시한다", () => {
    const cells = days(
      pickerCells([2026, 10], {
        today: "2026-10-01",
        selection: { start: "2026-10-30", end: "2026-10-31" },
      }),
    );
    expect(cells.find((c) => c.date === "2026-10-30")?.selected).toBe("start");
    expect(cells.find((c) => c.date === "2026-10-31")?.selected).toBe("end");
  });
});
