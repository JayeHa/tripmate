import { describe, expect, it } from "vitest";

import { linkDomain, linkTitleOf, linkToneOf } from "./memo-link";

describe("linkTitleOf", () => {
  it("아는 사이트는 그 이름", () => {
    expect(linkTitleOf("https://maps.app.goo.gl/abc")).toBe("구글 지도 위치");
    expect(linkTitleOf("https://www.google.com/maps/place/x")).toBe("구글 지도 위치");
    expect(linkTitleOf("https://www.kkday.com/ko/product/1")).toBe("KKday 상품");
    expect(linkTitleOf("https://m.klook.com/activity/2")).toBe("Klook 상품");
    expect(linkTitleOf("https://youtu.be/xyz")).toBe("YouTube 영상");
    expect(linkTitleOf("https://tabelog.com/tokyo/A1301/")).toBe("타베로그 맛집 정보");
  });

  it("구글이어도 지도가 아니면 도메인", () => {
    expect(linkTitleOf("https://www.google.com/search?q=a")).toBe("google.com");
  });

  it("모르는 사이트는 www. 를 뗀 도메인", () => {
    expect(linkTitleOf("https://www.example.co.jp/a")).toBe("example.co.jp");
  });
});

describe("linkDomain · linkToneOf", () => {
  it("주소가 아니면 글 그대로, 같은 도메인은 같은 색", () => {
    expect(linkDomain("not a url")).toBe("not a url");
    expect(linkToneOf("kkday.com", 5)).toBe(linkToneOf("kkday.com", 5));
    expect(linkToneOf("kkday.com", 5)).toBeLessThan(5);
  });
});
