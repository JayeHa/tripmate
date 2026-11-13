import { describe, expect, it } from "vitest";

import type { VisitPhoto } from "@/entities/schedule-item";

import {
  draftOf,
  type DraftPhoto,
  hasPhotoChanges,
  photoChanges,
  uncaptioned,
} from "./photo-draft";

/** 테스트용 저장된 사진 */
function saved(id: string, position: number, caption: string | null = null): VisitPhoto {
  return {
    id,
    item_id: "i",
    trip_id: "t",
    user_id: "me",
    photo_key: `t/${id}.jpg`,
    thumb_key: `t/${id}-t.jpg`,
    caption,
    position,
    created_at: "2027-01-01",
    video_key: null,
    duration: null,
    poster_at: null,
  };
}

/** 테스트용 새 사진 */
function picked(key: string, caption = ""): DraftPhoto {
  return { key, saved: null, file: new File([], `${key}.jpg`), preview: null, caption };
}

describe("photoChanges", () => {
  it("그대로면 할 일이 없다", () => {
    const rows = [saved("a", 0, "입구"), saved("b", 1)];
    expect(hasPhotoChanges(photoChanges(rows, draftOf(rows)))).toBe(false);
  });

  it("뺀 사진은 지우고, 설명은 다듬어 바뀐 것만, 새 사진은 남은 사진 뒤에", () => {
    const rows = [saved("a", 0, "입구"), saved("b", 3), saved("c", 7)];
    const draft = draftOf(rows).filter((d) => d.key !== "c");
    draft[0].caption = " 입구 ";
    draft[1].caption = "  메뉴판 ";
    draft.push(picked("n1", "  "), picked("n2", "라멘"));
    const c = photoChanges(rows, draft);
    expect(c.removed.map((p) => p.id)).toEqual(["c"]);
    expect(c.captions).toEqual([{ id: "b", caption: "메뉴판" }]);
    expect(c.added.map(({ key, caption, position }) => ({ key, caption, position }))).toEqual([
      { key: "n1", caption: null, position: 4 },
      { key: "n2", caption: "라멘", position: 5 },
    ]);
  });

  it("올린 새 사진은 다시 올리지 않는다 — 설명을 지우면 null", () => {
    const up = { ...picked("n1"), saved: saved("x", 0, "라멘"), caption: "" };
    const c = photoChanges([], [up]);
    expect(c.added).toEqual([]);
    expect(c.captions).toEqual([{ id: "x", caption: null }]);
  });
});

describe("uncaptioned", () => {
  it("공백뿐인 설명도 설명 없음", () => {
    expect(uncaptioned([picked("a", " "), picked("b", "x"), picked("c")])).toBe(2);
  });
});
