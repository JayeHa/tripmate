import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "@/entities/schedule-item";

import { noteDraftOf, toDayMemoText, toNotePatch } from "./day-memo";

describe("toDayMemoText", () => {
  it("앞뒤 공백을 떼고, 중요면 「★ 」 를 앞에. 비거나 500자를 넘으면 오류", () => {
    expect(toDayMemoText("  집합 7시 ", false)).toEqual({ ok: true, text: "집합 7시" });
    expect(toDayMemoText("집합", true)).toEqual({ ok: true, text: "★ 집합" });
    expect(toDayMemoText(" ", false)).toMatchObject({ ok: false });
    expect(toDayMemoText("가".repeat(501), false)).toMatchObject({ ok: false });
  });
});

describe("날짜 메모 고치기", () => {
  const item = { name: "체크인 15시", start_time: "15:00:00" } as ScheduleItem;

  it("처음 값은 시간(HH:mm) · 글", () => {
    expect(noteDraftOf(item)).toEqual({ time: "15:00", text: "체크인 15시" });
    expect(noteDraftOf({ name: null, start_time: null } as ScheduleItem)).toEqual({
      time: "",
      text: "",
    });
  });

  it("바뀐 칸만 보내고, 시간을 비우면 null", () => {
    const opened = noteDraftOf(item);
    expect(toNotePatch(opened, opened)).toEqual({ ok: true, patch: {} });
    expect(toNotePatch({ ...opened, text: " 체크인 16시 " }, opened)).toEqual({
      ok: true,
      patch: { name: "체크인 16시" },
    });
    // 시간 칸이 틀린 채(친 그대로) 넘어오면 저장하지 않는다
    expect(toNotePatch({ ...opened, time: "25:00" }, opened)).toEqual({
      ok: false,
      error: "시간을 확인해 주세요",
    });
    expect(toNotePatch({ ...opened, time: "" }, opened)).toEqual({
      ok: true,
      patch: { start_time: null },
    });
    expect(toNotePatch({ ...opened, text: "" }, opened)).toMatchObject({ ok: false });
  });
});
