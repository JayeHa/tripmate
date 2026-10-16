import { describe, expect, it } from "vitest";

import type { Voucher } from "../model/types";
import {
  ownedBy,
  parsePages,
  targetColumns,
  voucherFileKeys,
  voucherGroup,
  voucherNumbers,
  voucherTarget,
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
