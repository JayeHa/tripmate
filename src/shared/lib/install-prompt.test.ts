import { describe, expect, it } from "vitest";

import {
  inAppOf,
  installModeOf,
  isIosSafari,
  isIosTopShare,
  kakaoOpenExternalUrl,
} from "./install-prompt";

describe("앱 추가 안내 방식", () => {
  const base = { standalone: false, inApp: false, canPrompt: false, ios: false, iosTop: false };

  it("이미 앱으로 열었으면 안내하지 않는다", () => {
    expect(installModeOf({ ...base, standalone: true, canPrompt: true, ios: true })).toBeNull();
  });

  it("앱 안 브라우저는 바깥에서 열기가 먼저", () => {
    expect(installModeOf({ ...base, inApp: true, ios: true })).toBe("in-app");
  });

  it("설치 창을 띄울 수 있으면 「설치」", () => {
    expect(installModeOf({ ...base, canPrompt: true })).toBe("prompt");
  });

  it("iOS Safari · iOS Chrome/Edge 는 3단계, 그 밖에 설치할 수 없는 브라우저는 숨긴다", () => {
    expect(installModeOf({ ...base, ios: true })).toBe("ios");
    expect(installModeOf({ ...base, iosTop: true })).toBe("ios-top");
    expect(installModeOf(base)).toBeNull();
  });
});

describe("앱 안 브라우저", () => {
  it("카카오톡 · 인스타그램 · 네이버 앱을 이름으로 가른다", () => {
    expect(
      inAppOf(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 KAKAOTALK 10.9.0",
      ),
    ).toEqual({
      name: "카카오톡",
      android: false,
      kakao: true,
    });
    expect(
      inAppOf(
        "Mozilla/5.0 (Linux; Android 14; SM-S921N) Chrome/130.0 Mobile Safari/537.36 KAKAOTALK/10.9.0",
      ),
    ).toEqual({ name: "카카오톡", android: true, kakao: true });
    expect(
      inAppOf(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Instagram 350.0.0.0",
      )?.name,
    ).toBe("인스타그램");
    expect(
      inAppOf(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/605.1 NAVER(inapp; search; 2000; 12.10.0)",
      )?.name,
    ).toBe("네이버 앱");
  });

  it("보통 브라우저는 아니다", () => {
    expect(
      inAppOf(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBeNull();
    expect(inAppOf("Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36")).toBeNull();
  });
});

describe("iOS Chrome · Edge", () => {
  const chrome = (os: string) =>
    `Mozilla/5.0 (iPhone; CPU iPhone OS ${os} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1`;

  it("iOS 16.4 부터 공유 메뉴로 추가할 수 있다", () => {
    expect(isIosTopShare(chrome("16_4"), 5)).toBe(true);
    expect(isIosTopShare(chrome("18_0"), 5)).toBe(true);
    expect(isIosTopShare(chrome("16_3"), 5)).toBe(false);
  });

  it("Edge 도 같고, Safari · Firefox 는 아니다", () => {
    expect(
      isIosTopShare(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 EdgiOS/130.0.2849.80 Mobile/15E148 Safari/605.1.15",
        5,
      ),
    ).toBe(true);
    expect(
      isIosTopShare(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1",
        5,
      ),
    ).toBe(false);
    expect(
      isIosTopShare(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) FxiOS/132.0 Mobile/15E148 Safari/605.1.15",
        5,
      ),
    ).toBe(false);
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

describe("카카오톡에서 바깥 브라우저로", () => {
  it("주소를 인코딩해 openExternal 스킴에 싣는다", () => {
    expect(kakaoOpenExternalUrl("https://tripmate.app/trips?x=1")).toBe(
      "kakaotalk://web/openExternal?url=https%3A%2F%2Ftripmate.app%2Ftrips%3Fx%3D1",
    );
  });
});
