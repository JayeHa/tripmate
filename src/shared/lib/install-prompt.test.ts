import { describe, expect, it } from "vitest";

import { installModeOf, isIosDevice } from "./install-prompt";

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

describe("iOS 기기", () => {
  const iphone =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
  const mac =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

  it("iPhone 은 iOS", () => {
    expect(isIosDevice(iphone, 5)).toBe(true);
  });

  it("iPad 는 Mac 처럼 알리지만 터치로 가른다", () => {
    expect(isIosDevice(mac, 5)).toBe(true);
    expect(isIosDevice(mac, 0)).toBe(false);
  });
});
