import { describe, expect, it } from "vitest";

import type { Voucher } from "@/entities/voucher";

import {
  downloadStep,
  type FailedItem,
  failedPhotoLine,
  isExpired,
  keepUntilDate,
  menuHint,
  partialTitle,
  photoTargets,
  retryScope,
  type SavedTrip,
  tripPagePaths,
  withDataMissing,
} from "./offline-plan";

/** 테스트용 바우처 — 사진 칸만 */
function voucher(over: Partial<Voucher>): Voucher {
  return {
    title: "입장권",
    file_key: null,
    file_mime: null,
    page_keys: [],
    thumb_key: null,
    ...over,
  } as Voucher;
}

/** 테스트용 받은 기록 */
function saved(over: Partial<SavedTrip>): SavedTrip {
  return {
    status: "done",
    done: 3,
    total: 3,
    failed: [],
    missing: 0,
    savedAt: "2026-10-23T09:00:00.000Z",
    keepUntil: "2026-11-05",
    ...over,
  };
}

const photo = (label: string): FailedItem => ({
  kind: "photo",
  bucket: "pack-photos",
  keys: [label],
  label,
});

describe("받을 화면", () => {
  it("탭 화면과 비용 상세 — 지도 · 수정 화면은 없다", () => {
    const paths = tripPagePaths("t", ["e1"]);
    expect(paths).toContain("/trips/t/schedule");
    expect(paths).toContain("/trips/t/expenses/new");
    expect(paths).toContain("/trips/t/expenses/e1");
    expect(paths.some((p) => p.includes("map") || p.endsWith("/edit"))).toBe(false);
  });
});

describe("받을 사진", () => {
  it("PDF 바우처는 쪽마다 하나, 썸네일은 첫 장에 붙는다 — 원본 PDF 는 받지 않는다", () => {
    const pdf = voucher({
      file_key: "t/a.pdf",
      file_mime: "application/pdf",
      page_keys: ["p1", "p2"],
      thumb_key: "th",
    });
    expect(photoTargets([pdf], []).map((t) => t.keys)).toEqual([["p1", "th"], ["p2"]]);
  });

  it("사진 바우처는 원본 하나, 그림 없는 PDF 는 썸네일만, 파일 없는 바우처는 없음", () => {
    const img = voucher({ file_key: "t/a.jpg", file_mime: "image/jpeg", thumb_key: "th" });
    const bare = voucher({ file_key: "t/b.pdf", file_mime: "application/pdf", thumb_key: "th2" });
    expect(photoTargets([img, bare, voucher({})], []).map((t) => t.keys)).toEqual([
      ["t/a.jpg", "th"],
      ["th2"],
    ]);
  });

  it("환급 사진은 사진 · 썸네일 한 묶음, 이름은 「환급 · 매장 종류」", () => {
    expect(
      photoTargets(
        [],
        [],
        [{ kind: "capture", photo_key: "r", thumb_key: "rt", store: "AlpenTOKYO" }],
      ),
    ).toEqual([{ bucket: "refund-photos", keys: ["r", "rt"], label: "환급 · AlpenTOKYO 캡처" }]);
  });

  it("쇼핑 사진은 사진 · 썸네일 한 묶음, 이름은 「쇼핑 · 항목」", () => {
    const items = [
      { name: "영수증", photo_key: "p", thumb_key: "pt" },
      { name: "사진 없음", photo_key: null, thumb_key: null },
    ];
    expect(photoTargets([], items)).toEqual([
      { bucket: "pack-photos", keys: ["p", "pt"], label: "쇼핑 · 영수증" },
    ]);
  });
});

describe("보관 기한", () => {
  it("여행이 일찍 끝나면 받은 날부터 7일", () => {
    expect(keepUntilDate("2026-10-23", "2026-10-25")).toBe("2026-10-30");
  });

  it("여행이 늦게 끝나면 여행 끝 다음 날까지", () => {
    expect(keepUntilDate("2026-10-23", "2026-11-04")).toBe("2026-11-05");
  });

  it("아주 먼 여행이어도 받은 날부터 60일까지", () => {
    expect(keepUntilDate("2026-10-23", "2027-03-01")).toBe("2026-12-22");
  });

  it("기한 다음 날부터 지난 것 — 받는 중이면 아니다", () => {
    expect(isExpired(saved({}), "2026-11-05")).toBe(false);
    expect(isExpired(saved({}), "2026-11-06")).toBe(true);
    expect(isExpired(saved({ status: "busy" }), "2026-11-06")).toBe(false);
  });
});

describe("메뉴 힌트", () => {
  const today = "2026-10-24";

  it("오프라인이면 무엇이든 「연결되면」 + 흐리게", () => {
    expect(menuHint(saved({}), false, today)).toEqual({ text: "연결되면", muted: true });
  });

  it("받은 적 없음 · 기한 지남은 없음, 받는 중 · 받음", () => {
    expect(menuHint(undefined, true, today).text).toBeNull();
    expect(menuHint(saved({}), true, "2026-12-01").text).toBeNull();
    expect(menuHint(saved({ status: "busy" }), true, today).text).toBe("받는 중");
    expect(menuHint(saved({}), true, today).text).toMatch(/^10\.2[34] 받음$/);
  });
});

describe("받기 창 단계", () => {
  const today = "2026-10-24";

  it("처음 · 받는 중 · 일부 실패", () => {
    expect(downloadStep(undefined, false, today)).toBe("confirm");
    expect(downloadStep(saved({ status: "busy" }), true, today)).toBe("busy");
    expect(downloadStep(saved({ status: "partial" }), false, today)).toBe("partial");
  });

  it("다 받음 — 이 창에서 받았으면 완료, 전에 받았으면 다시 받을지", () => {
    expect(downloadStep(saved({}), true, today)).toBe("done");
    expect(downloadStep(saved({}), false, today)).toBe("again");
  });
});

describe("일부 실패", () => {
  it("사진만 못 받았으면 「사진 N장」, 섞였으면 「N개」", () => {
    const two = saved({ status: "partial", failed: [photo("a"), photo("b")], missing: 2 });
    expect(partialTitle(two)).toBe("사진 2장을 받지 못했어요");
    const mixed = saved({ status: "partial", failed: [photo("a"), { kind: "data" }], missing: 2 });
    expect(partialTitle(mixed)).toBe("2개를 받지 못했어요");
  });

  it("도중에 끊겨 다 모르면 전부 다시 받는다", () => {
    expect(retryScope(saved({ failed: [photo("a")], missing: 1 }))).toBe("failed");
    expect(retryScope(saved({ failed: [photo("a")], missing: 5 }))).toBe("all");
  });

  it("사진 줄 — 하나면 이름, 여럿이면 「외 N장」", () => {
    expect(failedPhotoLine([{ kind: "data" }])).toBeNull();
    expect(failedPhotoLine([photo("쇼핑 · 영수증")])).toBe("쇼핑 · 영수증");
    expect(failedPhotoLine([photo("쇼핑 · 영수증"), photo("x")])).toBe("쇼핑 · 영수증 외 1장");
  });
});

describe("데이터가 캐시에서 사라짐", () => {
  it("다 받은 기록은 데이터 하나를 못 받은 일부 실패로", () => {
    const next = withDataMissing(saved({}));
    expect(next).toMatchObject({ status: "partial", failed: [{ kind: "data" }], missing: 1 });
    expect(retryScope(next)).toBe("failed");
  });

  it("이미 데이터를 못 받은 기록은 두 번 세지 않는다", () => {
    const prev = saved({ status: "partial", failed: [{ kind: "data" }, photo("a")], missing: 2 });
    expect(withDataMissing(prev)).toMatchObject({ failed: prev.failed, missing: 2 });
  });

  it("도중에 끊긴 기록은 다시 받기가 그대로 전부", () => {
    const cut = saved({ status: "partial", failed: [photo("a")], missing: 5 });
    expect(retryScope(withDataMissing(cut))).toBe("all");
  });
});
