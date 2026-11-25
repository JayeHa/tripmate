import { describe, expect, it } from "vitest";

import { linkOf, pastedUrl, pullTypedLinks, typedUrl } from "./memo-links";

describe("pullTypedLinks", () => {
  it("뒤에 띄어쓰기를 친 주소는 글에서 빼고 링크로", () => {
    expect(pullTypedLinks("입장권 https://www.kkday.com/p/1 ", [])).toEqual({
      text: "입장권 ",
      links: [{ title: "KKday 상품", url: "https://www.kkday.com/p/1" }],
      added: 1,
    });
  });

  it("줄바꿈은 남긴다", () => {
    expect(pullTypedLinks("a https://x.com/a\nb", []).text).toBe("a \nb");
  });

  it("치는 중인 주소(글 끝)는 그대로", () => {
    expect(pullTypedLinks("a https://x.co", [])).toMatchObject({
      text: "a https://x.co",
      added: 0,
    });
  });

  it("이미 있는 주소는 글에서만 빼고, 다섯 개가 차면 글에 남긴다", () => {
    const one = linkOf("https://x.com/1");
    expect(pullTypedLinks("https://x.com/1 ", [one])).toEqual({ text: "", links: [one], added: 0 });
    const five = [1, 2, 3, 4, 5].map((n) => linkOf(`https://x.com/${n}`));
    expect(pullTypedLinks("https://y.com ", five)).toMatchObject({
      text: "https://y.com ",
      added: 0,
    });
  });
});

describe("pastedUrl · typedUrl", () => {
  it("주소 하나만 붙여넣었을 때만 링크", () => {
    expect(pastedUrl(" https://x.com/a ")).toBe("https://x.com/a");
    expect(pastedUrl("보세요 https://x.com")).toBeNull();
  });

  it("「https://」 를 빼먹으면 붙이고, 주소가 아니면 null", () => {
    expect(typedUrl("klook.com/a")).toBe("https://klook.com/a");
    expect(typedUrl("http://a.com")).toBe("http://a.com");
    expect(typedUrl("두 단어")).toBeNull();
    expect(typedUrl("")).toBeNull();
    expect(typedUrl("https://")).toBeNull();
    expect(typedUrl("localhost")).toBeNull();
  });
});
