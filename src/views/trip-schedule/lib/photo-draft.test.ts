import { describe, expect, it } from "vitest";

import type { VisitPhoto } from "@/entities/schedule-item";

import {
  countText,
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
  return {
    key,
    saved: null,
    file: new File([], `${key}.jpg`),
    preview: null,
    caption,
    video: null,
  };
}

/** 테스트용 새 영상 — 12초, 표지 1초 */
function pickedVideo(key: string): DraftPhoto {
  const local = { poster: new Blob(), src: `blob:${key}` };
  return { ...picked(key), video: { duration: 12, posterAt: 1, local } };
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

describe("영상", () => {
  it("저장된 영상 줄은 길이 · 표지 지점을 들고 시작한다", () => {
    const row = { ...saved("v", 1), video_key: "t/v.mp4", duration: 12.4, poster_at: 1 };
    const [photo, video] = draftOf([saved("a", 0), row]);
    expect(photo.video).toBeNull();
    expect(video.video).toEqual({ duration: 12.4, posterAt: 1, local: null });
  });

  it("새 영상은 읽은 값을 들고 올릴 것에 든다", () => {
    const c = photoChanges([], [picked("p"), pickedVideo("v")]);
    expect(c.added.map((a) => a.video?.duration ?? null)).toEqual([null, 12]);
    expect(c.added[1].video?.local?.src).toBe("blob:v");
  });
});

describe("countText", () => {
  it("개수 · 영상 수 · 설명 없는 수 — 없는 조각은 뺀다", () => {
    expect(countText([], 10)).toBe("0 / 10");
    expect(countText([picked("a", "입구"), picked("b", "메뉴")], 10)).toBe("2 / 10");
    const draft = [picked("a", "입구"), { ...pickedVideo("v"), caption: "불꽃" }, picked("c")];
    expect(countText(draft, 10)).toBe("3 / 10 · 영상 1 · 설명 없음 1");
  });
});
