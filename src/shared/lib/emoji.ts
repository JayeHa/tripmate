/** 「최근 · 추천」 의 추천 24개 — 최근 쓴 것을 앞에 두고 나머지를 이것으로 채운다 */
export const RECOMMENDED_EMOJIS = [
  "🏨",
  "🛏️",
  "🏠",
  "🍜",
  "🍣",
  "🍱",
  "🍺",
  "☕",
  "🍰",
  "🛍️",
  "🎁",
  "🗼",
  "⛩️",
  "🏯",
  "🎡",
  "🎢",
  "♨️",
  "🏃",
  "🚃",
  "🚄",
  "✈️",
  "🚌",
  "📷",
  "⭐",
];

/** 「최근 · 추천」 을 뺀 탭과 그 이모지(각 16) */
export const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "숙소·장소",
    emojis: [
      "🏨",
      "🛏️",
      "🏠",
      "🏢",
      "⛩️",
      "🏯",
      "🗼",
      "🗻",
      "🌸",
      "🎡",
      "🎢",
      "♨️",
      "🏞️",
      "🌃",
      "🏖️",
      "🎨",
    ],
  },
  {
    label: "음식",
    emojis: [
      "🍜",
      "🍣",
      "🍱",
      "🍛",
      "🍙",
      "🥟",
      "🍤",
      "🍢",
      "🥩",
      "🍺",
      "🍶",
      "☕",
      "🍰",
      "🍦",
      "🧁",
      "🍡",
    ],
  },
  {
    label: "쇼핑",
    emojis: [
      "🛍️",
      "🎁",
      "👟",
      "👕",
      "💄",
      "📚",
      "🧸",
      "🎮",
      "🐹",
      "🐰",
      "💍",
      "🕶️",
      "🧴",
      "🍫",
      "🛒",
      "💳",
    ],
  },
  {
    label: "이동",
    emojis: [
      "🚃",
      "🚄",
      "🚇",
      "✈️",
      "🚌",
      "🚕",
      "🚶",
      "🏃",
      "🚲",
      "⛴️",
      "🧳",
      "🎫",
      "🗺️",
      "📍",
      "⏰",
      "📷",
    ],
  },
];

/** 최근에 쓴 이모지는 8개까지 기억한다 */
export const RECENT_MAX = 8;

/** 처음 쓸 때 만든 글자 묶음 분할기. 지원하지 않는 브라우저(Firefox 124 이하)면 false */
let segmenter: Intl.Segmenter | false | undefined;

/**
 * 화면에 한 글자로 보이는 묶음(grapheme) 단위로 나눈다 — 국기 · 피부색 · ZWJ 묶음이 한 덩어리가 된다.
 * 모듈을 불러올 때 만들지 않는다 — 지원하지 않는 브라우저에서 이 파일을 쓰는 화면 전체가 깨진다.
 * 없으면 코드포인트로 나눈다(국기 · 피부색이 낱자로 떨어지지만 이모지는 고를 수 있다)
 */
function graphemes(text: string): string[] {
  segmenter ??=
    typeof Intl.Segmenter === "function" &&
    new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : [...text];
}

/** 묶음 안에 이모지가 있는지 — 그림 문자 · 국기(지역 표시 문자) · 키캡(1️⃣) */
const EMOJI_PART = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3/u;

/** 입력한 글에서 첫 이모지(묶음 그대로). 없으면 null — 키보드로 친 글자 중 이모지만 받는다 */
export function firstEmoji(text: string): string | null {
  return graphemes(text).find((g) => EMOJI_PART.test(g)) ?? null;
}

/** 방금 쓴 이모지를 맨 앞에 — 같은 것은 한 번만, RECENT_MAX 개까지 */
export function pushRecent(recent: readonly string[], emoji: string): string[] {
  return [emoji, ...recent.filter((e) => e !== emoji)].slice(0, RECENT_MAX);
}

/** 「최근 · 추천」 24칸 — 최근 쓴 것(최대 8) 다음에 추천을 겹치지 않게 채운다 */
export function recentAndRecommended(recent: readonly string[]): string[] {
  const head = recent.slice(0, RECENT_MAX);
  return [...head, ...RECOMMENDED_EMOJIS.filter((e) => !head.includes(e))].slice(
    0,
    RECOMMENDED_EMOJIS.length,
  );
}

/** 기기 판별에 쓰는 값 — navigator 에서 꺼내 넘긴다(테스트에서 바꿔 끼우려고) */
export type DeviceInfo = { userAgent: string; platform: string; maxTouchPoints: number };

/** 기기 종류. 아이콘을 고르는 데 쓴다 */
export type EmojiHintKind = "phone" | "computer" | "other";

/**
 * 이모지 키보드를 여는 방법 안내. 브라우저는 기기 이모지 창을 직접 열 수 없어 방법만 알려 준다.
 * iPad 는 Mac 처럼 보고하지만 터치가 있어 iOS 로 본다
 */
export function emojiKeyboardHint({ userAgent, platform, maxTouchPoints }: DeviceInfo): {
  kind: EmojiHintKind;
  text: string;
} {
  const touch = maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Mac/.test(platform || userAgent) && touch)) {
    return { kind: "phone", text: "키보드의 🌐 또는 😊 키를 눌러 이모지를 입력해요" };
  }
  if (/Android/.test(userAgent)) {
    return { kind: "phone", text: "키보드의 😊 키를 눌러 이모지를 입력해요" };
  }
  if (/Mac/.test(platform || userAgent)) {
    return { kind: "computer", text: "⌃ ⌘ Space 로 이모지 창을 열 수 있어요" };
  }
  if (/Win/.test(platform || userAgent)) {
    return { kind: "computer", text: "Win + . 로 이모지 창을 열 수 있어요" };
  }
  return { kind: "other", text: "기기의 이모지 키보드로 입력해요" };
}
