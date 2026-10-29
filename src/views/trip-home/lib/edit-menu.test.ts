import { describe, expect, it } from "vitest";

import { editMenu } from "./edit-menu";

describe("editMenu", () => {
  it("방장은 맨 아래 「여행 삭제」, 멤버는 「여행 나가기」, 모르면 빨간 줄 없음", () => {
    expect(editMenu(true)).toEqual(["cities", "title", "dates", "invite", "widgets", "delete"]);
    expect(editMenu(false)).toEqual(["cities", "title", "dates", "invite", "widgets", "leave"]);
    expect(editMenu(null)).toEqual(["cities", "title", "dates", "invite", "widgets"]);
  });
});
