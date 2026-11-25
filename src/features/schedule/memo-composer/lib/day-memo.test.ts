import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "@/entities/schedule-item";

import { noteDraftOf, toNewNote, toNotePatch } from "./day-memo";

const LINK = { title: "KKday 상품", url: "https://www.kkday.com/p/1" };

describe("toNewNote", () => {
  it("앞뒤 공백을 떼고, 중요면 「★ 」 를 앞에, 빈 시간은 null", () => {
    const empty = noteDraftOf(null);
    expect(toNewNote({ ...empty, body: "  집합 7시 " })).toEqual({
      ok: true,
      value: { text: "집합 7시", time: null, links: [] },
    });
    expect(
      toNewNote({ ...empty, body: "집합", starred: true, time: "18:50", links: [LINK] }),
    ).toEqual({ ok: true, value: { text: "★ 집합", time: "18:50", links: [LINK] } });
  });

  it("비거나 500자를 넘거나 시간이 틀리면 오류", () => {
    const empty = noteDraftOf(null);
    expect(toNewNote({ ...empty, body: " " })).toMatchObject({ ok: false });
    expect(toNewNote({ ...empty, body: "가".repeat(501) })).toMatchObject({ ok: false });
    expect(toNewNote({ ...empty, body: "a", time: "25:00" })).toEqual({
      ok: false,
      error: "시간을 확인해 주세요",
    });
  });
});

describe("날짜 메모 고치기", () => {
  const item = {
    name: "★ 체크인 15시",
    start_time: "15:00:00",
    pinned_by: null,
    links: [LINK, { title: "x", url: "javascript:alert(1)" }],
  } as unknown as ScheduleItem;

  it("처음 값은 시간(HH:mm) · ★ 뗀 글 · 중요 · 고정 · 올바른 링크만", () => {
    expect(noteDraftOf(item)).toEqual({
      time: "15:00",
      body: "체크인 15시",
      starred: true,
      pinned: false,
      links: [LINK],
    });
  });

  it("바뀐 칸만 보내고, 시간을 비우면 null", () => {
    const opened = noteDraftOf(item);
    expect(toNotePatch(opened, opened, null)).toEqual({ ok: true, patch: {} });
    expect(toNotePatch({ ...opened, body: " 체크인 16시 " }, opened, null)).toEqual({
      ok: true,
      patch: { name: "★ 체크인 16시" },
    });
    expect(toNotePatch({ ...opened, starred: false }, opened, null)).toEqual({
      ok: true,
      patch: { name: "체크인 15시" },
    });
    expect(toNotePatch({ ...opened, time: "" }, opened, null)).toEqual({
      ok: true,
      patch: { start_time: null },
    });
    expect(toNotePatch({ ...opened, links: [] }, opened, null)).toEqual({
      ok: true,
      patch: { links: [] },
    });
    expect(toNotePatch({ ...opened, body: "" }, opened, null)).toMatchObject({ ok: false });
    // 고정을 바꿨을 때만 고정한 사람을 보낸다
    expect(toNotePatch({ ...opened, pinned: true }, opened, "me")).toEqual({
      ok: true,
      patch: { pinned_by: "me" },
    });
  });
});
