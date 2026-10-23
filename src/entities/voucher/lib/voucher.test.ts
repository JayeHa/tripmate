import { describe, expect, it } from "vitest";

import type { Voucher } from "../model/types";
import {
  cardVouchers,
  cardVoucherTarget,
  linkedVoucherCount,
  ownedBy,
  parsePages,
  targetColumns,
  viewerKeys,
  voucherCountFor,
  voucherFileKeys,
  voucherGroup,
  voucherNumbers,
  voucherTarget,
  voucherUnlinkNote,
} from "./voucher";
import { titleFromFileName, voucherKeysInTrip } from "./voucher-rules";

/** 연결 칸만 있는 바우처 */
const linked = (cols: Partial<Pick<Voucher, "schedule_item_id" | "flight_id" | "stay_id">>) => ({
  schedule_item_id: null,
  flight_id: null,
  stay_id: null,
  ...cols,
});

describe("연결 · 묶음", () => {
  it("채워진 칸이 대상이고, 없으면 기타", () => {
    expect(voucherTarget(linked({ flight_id: "f" }))).toEqual({ kind: "flight", id: "f" });
    expect(voucherTarget(linked({}))).toBeNull();
    expect(voucherGroup(linked({ stay_id: "s" }))).toBe("stay");
    expect(voucherGroup(linked({ schedule_item_id: "c" }))).toBe("schedule");
    expect(voucherGroup(linked({}))).toBe("etc");
  });

  it("저장할 때는 세 칸을 모두 보낸다", () => {
    expect(targetColumns({ kind: "stay", id: "s" })).toEqual(linked({ stay_id: "s" }));
    expect(targetColumns(null)).toEqual(linked({}));
  });
});

describe("voucherNumbers", () => {
  it("모양이 다르거나 값이 빈 줄은 빼고, 종류가 없으면 예약번호", () => {
    const numbers = [
      { label: "바우처 번호", owner: "u1", value: "KK1" },
      { owner: "", value: "K7QX2M" },
      { label: "예약번호", value: "  " },
      "x",
      null,
    ];
    expect(voucherNumbers({ numbers })).toEqual([
      { label: "바우처 번호", owner: "u1", value: "KK1" },
      { label: "예약번호", owner: "", value: "K7QX2M" },
    ]);
    expect(voucherNumbers({ numbers: {} })).toEqual([]);
  });
});

describe("parsePages", () => {
  it("적은 순서 · 겹치면 한 번 · 범위 밖은 빼고 · 최대 5장, 남는 게 없으면 1쪽", () => {
    expect(parsePages("3, 1, 3", 4)).toEqual([3, 1]);
    expect(parsePages("0, 9", 4)).toEqual([1]);
    expect(parsePages("", 4)).toEqual([1]);
    expect(parsePages("1,2,3,4,5,6", 10)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("파일 키 · 주인", () => {
  it("원본 · 썸네일 · 그림 키를 모으고, 그 여행 폴더 밖 키는 거른다", () => {
    expect(
      voucherFileKeys({ file_key: "t/a.pdf", thumb_key: null, page_keys: ["t/1.png", "t/3.png"] }),
    ).toEqual(["t/a.pdf", "t/1.png", "t/3.png"]);
    expect(voucherKeysInTrip("t", ["t/a.pdf"])).toBe(true);
    expect(voucherKeysInTrip("t", ["u/a.pdf"])).toBe(false);
    expect(voucherKeysInTrip("t", ["t/../u/a.pdf"])).toBe(false);
  });

  it("주인이 비면 모두의 것", () => {
    expect(ownedBy({ owners: [] }, "u1")).toBe(true);
    expect(ownedBy({ owners: ["u2"] }, "u1")).toBe(false);
  });

  it("파일 이름에서 확장자를 뺀 것이 제목", () => {
    expect(titleFromFileName("제주항공 탑승권.pdf")).toBe("제주항공 탑승권");
    expect(titleFromFileName("ticket.v2.png")).toBe("ticket.v2");
  });
});

describe("일정 카드의 바우처", () => {
  const list = [
    { id: "a", ...linked({ schedule_item_id: "c1" }) },
    { id: "b", ...linked({ stay_id: "s1" }) },
    { id: "c", ...linked({ schedule_item_id: "c2" }) },
    { id: "d", ...linked({}) },
    { id: "e", ...linked({ flight_id: "f1" }) },
  ];

  it("그 카드에 붙은 것, 숙소 · 항공편 카드면 그 숙소 · 항공편에 붙은 것까지", () => {
    expect(cardVouchers(list, { id: "c1", stay_id: null }).map((v) => v.id)).toEqual(["a"]);
    expect(cardVouchers(list, { id: "c1", stay_id: "s1" }).map((v) => v.id)).toEqual(["a", "b"]);
    expect(
      cardVouchers(list, { id: "c9", stay_id: null, flight_id: "f1" }).map((v) => v.id),
    ).toEqual(["e"]);
  });

  it("바로 올린 바우처의 연결 — 숙소 카드는 숙소, 그 밖은 그 일정", () => {
    expect(cardVoucherTarget({ id: "c1", stay_id: "s1" })).toEqual({ kind: "stay", id: "s1" });
    expect(cardVoucherTarget({ id: "c1", stay_id: null })).toEqual({
      kind: "schedule_item",
      id: "c1",
    });
  });
});

describe("일정 지우기 안내", () => {
  it("카드 · 대체 장소에 직접 붙은 바우처만 센다", () => {
    const list = [
      linked({ schedule_item_id: "c1" }),
      linked({ schedule_item_id: "a1" }),
      linked({ stay_id: "s1" }),
    ];
    expect(linkedVoucherCount(list, ["c1", "a1"])).toBe(2);
    expect(voucherUnlinkNote(2)).toBe("연결된 바우처 2개는 연결만 풀리고 노트에 남아요.");
    expect(voucherUnlinkNote(0)).toBeNull();
  });
});

describe("voucherCountFor", () => {
  it("대상 중 하나에 연결된 바우처만 센다", () => {
    const list = [
      linked({ flight_id: "f1" }),
      linked({ schedule_item_id: "c1" }),
      linked({ stay_id: "s1" }),
      linked({}),
    ];
    expect(
      voucherCountFor(list, [
        { kind: "flight", id: "f1" },
        { kind: "schedule_item", id: "c1" },
      ]),
    ).toBe(2);
    expect(voucherCountFor(list, [{ kind: "stay", id: "s9" }])).toBe(0);
  });
});

describe("viewerKeys", () => {
  it("넘겨 볼 그림 — PDF 는 현장용 페이지 그림, 사진은 원본, 그림 없는 PDF · 파일 없음은 빈 목록", () => {
    const pdf = { file_key: "t/a.pdf", file_mime: "application/pdf" };
    expect(viewerKeys({ ...pdf, page_keys: ["p2", "p1"] })).toEqual(["p2", "p1"]);
    expect(viewerKeys({ ...pdf, page_keys: [] })).toEqual([]);
    expect(viewerKeys({ file_key: "t/a.jpg", file_mime: "image/jpeg", page_keys: [] })).toEqual([
      "t/a.jpg",
    ]);
    expect(viewerKeys({ file_key: null, file_mime: null, page_keys: [] })).toEqual([]);
  });
});
