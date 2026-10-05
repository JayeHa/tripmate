import { describe, expect, it } from "vitest";

import {
  emojiKeyboardHint,
  firstEmoji,
  pushRecent,
  recentAndRecommended,
  RECOMMENDED_EMOJIS,
} from "./emoji";

/** 기기 값 — 빈 값으로 시작해 필요한 것만 바꾼다 */
const device = (over: Partial<Parameters<typeof emojiKeyboardHint>[0]>) => ({
  userAgent: "",
  platform: "",
  maxTouchPoints: 0,
  ...over,
});

describe("이모지 고르기", () => {
  it("입력한 글에서 첫 이모지만 — 변형 선택자 · ZWJ 묶음은 한 글자, 없으면 null", () => {
    expect(firstEmoji("가🍜🍣")).toBe("🍜");
    expect(firstEmoji("🛍️")).toBe("🛍️");
    expect(firstEmoji("👩‍💻 코딩")).toBe("👩‍💻");
    expect(firstEmoji("abc")).toBeNull();
  });

  it("최근 목록은 맨 앞에 넣고 겹치지 않게 8개까지", () => {
    expect(pushRecent(["🍜", "🍣"], "🍣")).toEqual(["🍣", "🍜"]);
    const full = ["1", "2", "3", "4", "5", "6", "7", "8"];
    expect(pushRecent(full, "🍜")).toEqual(["🍜", ...full.slice(0, 7)]);
  });

  it("「최근 · 추천」 은 최근 다음 추천을 겹치지 않게 24칸", () => {
    const list = recentAndRecommended(["🐹", "🍜"]);
    expect(list).toHaveLength(RECOMMENDED_EMOJIS.length);
    expect(list.slice(0, 3)).toEqual(["🐹", "🍜", "🏨"]);
    expect(list.filter((e) => e === "🍜")).toHaveLength(1);
  });

  it("기기별 이모지 키보드 안내 — iPad(Mac + 터치)는 iOS 로 본다", () => {
    expect(emojiKeyboardHint(device({ userAgent: "iPhone" })).text).toContain("🌐");
    expect(emojiKeyboardHint(device({ platform: "MacIntel", maxTouchPoints: 5 })).kind).toBe(
      "phone",
    );
    expect(emojiKeyboardHint(device({ userAgent: "Linux; Android 14" })).text).toContain("😊 키");
    expect(emojiKeyboardHint(device({ platform: "MacIntel" })).text).toContain("⌃ ⌘ Space");
    expect(emojiKeyboardHint(device({ platform: "Win32" })).text).toContain("Win + .");
    expect(emojiKeyboardHint(device({ platform: "Linux x86_64" })).kind).toBe("other");
  });
});
