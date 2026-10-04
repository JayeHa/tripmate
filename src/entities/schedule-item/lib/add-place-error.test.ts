import { describe, expect, it } from "vitest";

import { addPlaceErrorMessage } from "./add-place-error";

describe("addPlaceErrorMessage", () => {
  it.each([
    ["trip has no city and the place has no location", /검색 결과에서 장소를 골라/],
    ["place name is required", /이름을 입력/],
    ['new row violates row-level security policy for table "schedule_items"', /권한이 없어요/],
    ["fetch failed", /잠시 후 다시/],
  ])("%s → %s", (message, expected) => {
    expect(addPlaceErrorMessage(new Error(message))).toMatch(expected);
  });

  it("Error 가 아니면 다시 시도를 안내한다", () => {
    expect(addPlaceErrorMessage({ code: "x" })).toMatch(/잠시 후 다시/);
  });
});
