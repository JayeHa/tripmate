import { describe, expect, it } from "vitest";

import {
  DEFAULT_WIDGET_PREFS,
  moveWidget,
  parseWidgetPrefs,
  toggleWidget,
  visibleTiles,
  widgetEditRows,
} from "./widget-prefs";
import type { WidgetKey, WidgetSlots, WidgetTile } from "./widgets";

/** 테스트용 타일 */
const tile = (key: WidgetTile["key"], main = "값"): WidgetTile => ({
  key,
  label: key,
  main,
  sub: "",
});

/** 도쿄 여행 — 날씨 · 환율 보임, 공휴일 없음 · 시차 없음은 자동으로 숨김 */
const TOKYO: WidgetSlots = {
  weather: { tile: tile("weather"), auto: true },
  rate: { tile: tile("rate"), auto: true },
  holiday: { tile: tile("holiday", "없음"), auto: false },
  time: { tile: { ...tile("time", "14:32"), sub: "한국과 같음" }, auto: false },
};

const INFO = { city: "도쿄", currency: "JPY", home: "KRW", rate: { unit: 100, value: 920 } };

describe("parseWidgetPrefs", () => {
  it("모양이 다르면 기본값", () => {
    expect(parseWidgetPrefs(null)).toEqual(DEFAULT_WIDGET_PREFS);
    expect(parseWidgetPrefs("x")).toEqual(DEFAULT_WIDGET_PREFS);
  });

  it("모르는 · 겹친 이름은 빼고 빠진 위젯은 뒤에, shown 은 참거짓만", () => {
    expect(
      parseWidgetPrefs({
        order: ["time", "map", "time", "rate"],
        shown: { time: true, map: true, rate: "yes" },
      }),
    ).toEqual({ order: ["time", "rate", "weather", "holiday"], shown: { time: true } });
  });
});

describe("visibleTiles", () => {
  it("손대지 않으면 자동 — 고른 순서대로, 켠 것만", () => {
    expect(visibleTiles(TOKYO, DEFAULT_WIDGET_PREFS).map((t) => t.key)).toEqual([
      "weather",
      "rate",
    ]);
    const prefs = { order: ["time", "rate", "weather", "holiday"] as WidgetKey[], shown: {} };
    expect(visibleTiles(TOKYO, prefs).map((t) => t.key)).toEqual(["rate", "weather"]);
  });

  it("사용자가 고른 것이 자동보다 우선 — 그릴 것이 없으면 켜도 없음", () => {
    const slots = { ...TOKYO, rate: { tile: null, auto: false } };
    const prefs = { ...DEFAULT_WIDGET_PREFS, shown: { weather: false, time: true, rate: true } };
    expect(visibleTiles(slots, prefs).map((t) => t.key)).toEqual(["time"]);
  });
});

describe("toggleWidget · moveWidget", () => {
  it("지금 보이는 상태를 뒤집어 남긴다", () => {
    const off = toggleWidget(DEFAULT_WIDGET_PREFS, TOKYO, "weather");
    expect(off.shown).toEqual({ weather: false });
    expect(toggleWidget(off, TOKYO, "time").shown).toEqual({ weather: false, time: true });
  });

  it("껐다 다시 켜서 자동과 같아지면 사용자 선택을 지운다 — 다른 여행에서는 자동대로", () => {
    const off = toggleWidget(DEFAULT_WIDGET_PREFS, TOKYO, "weather");
    expect(toggleWidget(off, TOKYO, "weather").shown).toEqual({});
    const on = toggleWidget(DEFAULT_WIDGET_PREFS, TOKYO, "time");
    expect(toggleWidget(on, TOKYO, "time").shown).toEqual({});
  });

  it("from 자리의 위젯을 to 자리로", () => {
    expect(moveWidget(DEFAULT_WIDGET_PREFS, 3, 0).order).toEqual([
      "time",
      "weather",
      "rate",
      "holiday",
    ]);
  });
});

describe("widgetEditRows", () => {
  it("자동으로 숨긴 줄은 이유와 「자동으로 숨겼어요」, 손대면 이유만", () => {
    const rows = widgetEditRows(TOKYO, DEFAULT_WIDGET_PREFS, INFO);
    expect(rows.map((r) => [r.key, r.on, r.sub])).toEqual([
      ["weather", true, "도쿄 · 여행 10일 전부터 예보"],
      ["rate", true, "100엔 = ₩920 · 설정의 여행 환율"],
      ["holiday", false, "남은 기간에 공휴일이 없어요 · 자동으로 숨겼어요"],
      ["time", false, "한국과 시차가 없어요 · 자동으로 숨겼어요"],
    ]);
    const touched = { ...DEFAULT_WIDGET_PREFS, shown: { time: true } };
    expect(widgetEditRows(TOKYO, touched, INFO)[3]).toMatchObject({
      on: true,
      sub: "한국과 시차가 없어요",
    });
  });

  it("환율은 그릴 것이 없으면 막고 끈 것으로 — 국내 · 여행 환율 없음", () => {
    const slots = { ...TOKYO, rate: { tile: null, auto: false } };
    const prefs = { ...DEFAULT_WIDGET_PREFS, shown: { rate: true } };
    const domestic = widgetEditRows(slots, prefs, {
      ...INFO,
      currency: "KRW",
      rate: null,
    })[1];
    expect(domestic).toMatchObject({
      on: false,
      disabled: true,
      sub: "여행지 통화가 기준 화폐와 같아요",
    });
    expect(widgetEditRows(slots, prefs, { ...INFO, rate: null })[1].sub).toBe(
      "여행 환율이 없어요 · 설정에서 넣으면 보여요",
    );
  });
});
