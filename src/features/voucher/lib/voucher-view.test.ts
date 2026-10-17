import { describe, expect, it } from "vitest";

import { downloadName, numberLabel, sortNumbers } from "./voucher-view";

describe("downloadName", () => {
  it("제목 + 원본 확장자, 쓸 수 없는 글자는 「_」", () => {
    expect(
      downloadName({
        title: "치이카와/파크 입장권",
        file_name: "ticket.PDF",
        file_mime: "application/pdf",
      }),
    ).toBe("치이카와_파크 입장권.pdf");
  });

  it("원본 이름에 확장자가 없으면 종류에서, 원본이 없으면 null", () => {
    expect(downloadName({ title: "탑승권", file_name: "IMG", file_mime: "image/jpeg" })).toBe(
      "탑승권.jpg",
    );
    expect(downloadName({ title: "탑승권", file_name: null, file_mime: null })).toBeNull();
  });
});

describe("번호 줄", () => {
  const n = (owner: string, value: string) => ({ label: "예약번호", owner, value });
  const names: Record<string, string> = { me: "정원", f: "동규" };

  it("내 것 → 모두 → 일행 것, 같은 순위는 적은 순서", () => {
    const sorted = sortNumbers([n("f", "1"), n("", "2"), n("me", "3"), n("", "4")], "me");
    expect(sorted.map((x) => x.value)).toEqual(["3", "2", "4", "1"]);
  });

  it("라벨 — 나는 「(나)」, 주인 없음은 「모두」, 못 찾으면 「알 수 없음」", () => {
    const nameOf = (id: string) => names[id] ?? null;
    expect(numberLabel(n("me", "1"), "me", nameOf)).toBe("예약번호 · 정원 (나)");
    expect(numberLabel(n("f", "1"), "me", nameOf)).toBe("예약번호 · 동규");
    expect(numberLabel(n("", "1"), "me", nameOf)).toBe("예약번호 · 모두");
    expect(numberLabel(n("gone", "1"), "me", nameOf)).toBe("예약번호 · 알 수 없음");
  });
});
