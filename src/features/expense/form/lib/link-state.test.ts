import { describe, expect, it } from "vitest";

import { linkState } from "./link-state";

describe("linkState", () => {
  it("연결된 일정을 찾으면 연결됨", () => {
    expect(linkState("a", true, false)).toEqual({ itemId: "a", status: "linked", gone: false });
  });

  it("연결이 없으면 「연결 안 함」 을 골랐는지에 따라", () => {
    expect(linkState("", false, true)).toEqual({ itemId: "", status: "none", gone: false });
    expect(linkState("", false, false)).toEqual({ itemId: "", status: "prompt", gone: false });
  });

  it("연결했던 일정이 사라졌으면 저장할 id 를 비우고 「아직 안 고름」 으로 — 지운 id 를 보내면 FK 오류", () => {
    expect(linkState("a", false, false)).toEqual({ itemId: "", status: "prompt", gone: true });
  });
});
