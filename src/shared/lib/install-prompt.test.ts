import { describe, expect, it } from "vitest";

import { installModeOf, isIosSafari } from "./install-prompt";

describe("앱 추가 안내 방식", () => {
  it("이미 앱으로 열었으면 안내하지 않는다", () => {
    expect(installModeOf({ standalone: true, canPrompt: true, ios: true })).toBeNull();
  });

  it("설치 창을 띄울 수 있으면 「설치하기」", () => {
    expect(installModeOf({ standalone: false, canPrompt: true, ios: false })).toBe("prompt");
  });

  it("iOS 는 3단계, 그 밖에 설치할 수 없는 브라우저는 숨긴다", () => {
    expect(installModeOf({ standalone: false, canPrompt: false, ios: true })).toBe("ios");
    expect(installModeOf({ standalone: false, canPrompt: false, ios: false })).toBeNull();
  });
});

describe("iOS Safari", () => {
  const iphone =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
  const mac =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

  it("iPhone Safari", () => {
    expect(isIosSafari(iphone, 5)).toBe(true);
  });

  it("iPad 는 Mac 처럼 알리지만 터치로 가른다", () => {
    expect(isIosSafari(mac, 5)).toBe(true);
    expect(isIosSafari(mac, 0)).toBe(false);
  });

  it("iOS 의 다른 브라우저 · 인앱 브라우저는 아니다", () => {
    const others = [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/132.0 Mobile/15E148 Safari/605.1.15",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/130.0.2849.80 Mobile/15E148 Safari/605.1.15",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.9.0",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/605.1 NAVER(inapp; search; 2000; 12.10.0)",
    ];
    others.forEach((ua) => expect(isIosSafari(ua, 5)).toBe(false));
  });
});
