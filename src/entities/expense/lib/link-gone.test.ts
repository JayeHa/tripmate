import { describe, expect, it } from "vitest";

import { LINK_GONE, withLinkGone } from "./link-gone";

describe("withLinkGone", () => {
  it("연결 일정 FK 오류면 안내 문구로 바꾼다", () => {
    const error = {
      code: "23503",
      message:
        'insert or update on table "expenses" violates foreign key constraint "expenses_schedule_item_id_fkey"',
      details: null,
    };
    expect(withLinkGone(error)).toEqual(new Error(LINK_GONE));
  });

  it("다른 FK · 다른 오류는 그대로", () => {
    const guest = {
      code: "23503",
      message: 'violates foreign key constraint "expenses_payer_guest_id_fkey"',
    };
    const other = { code: "42501", message: "permission denied" };
    expect(withLinkGone(guest)).toBe(guest);
    expect(withLinkGone(other)).toBe(other);
  });
});
