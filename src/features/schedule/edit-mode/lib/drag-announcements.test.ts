import { describe, expect, it } from "vitest";

import { droppedText, movedText, pickedUpText } from "./drag-announcements";

describe("끌기 안내 문구", () => {
  it("들기 · 옮기기 · 놓기를 이름과 자리(1부터)로 알린다", () => {
    expect(pickedUpText("치이카와 파크", 2)).toBe("「치이카와 파크」 들었어요. 지금 2번째예요.");
    expect(movedText("치이카와 파크", 3)).toBe("「치이카와 파크」 3번째 자리예요.");
    expect(droppedText("치이카와 파크", 3, false)).toBe("「치이카와 파크」 3번째에 놓았어요.");
  });

  it("취소하면 자리 대신 제자리로 돌아왔다고 알린다", () => {
    expect(droppedText("치이카와 파크", 3, true)).toBe(
      "옮기기를 취소했어요. 「치이카와 파크」 제자리로 돌아왔어요.",
    );
  });
});
