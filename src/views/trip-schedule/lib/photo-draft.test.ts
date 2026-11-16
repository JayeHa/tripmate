import { describe, expect, it } from "vitest";

import type { VisitPhoto } from "@/entities/schedule-item";

import {
  countText,
  draftOf,
  type DraftPhoto,
  hasPhotoChanges,
  photoChanges,
  readPicked,
  toFront,
  uncaptioned,
  withCover,
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
  return { ...picked(key), video: { duration: 12, posterAt: 1, local, cover: null } };
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

describe("대표(맨 앞)", () => {
  it("toFront — 고른 것을 맨 앞으로, 나머지는 순서 그대로", () => {
    expect(toFront(["a", "b", "c", "d"], 2)).toEqual(["c", "a", "b", "d"]);
    expect(toFront(["a", "b"], 0)).toEqual(["a", "b"]);
  });

  it("옮기면 모두 놓인 자리로 다시 매긴다 — 열 때와 같은 값도 쓴다(일행이 그사이 옮긴 값을 덮게)", () => {
    const rows = [saved("a", 0), saved("b", 1), saved("c", 2)];
    const c = photoChanges(rows, toFront(draftOf(rows), 1));
    expect(c.moves).toEqual([
      { id: "b", position: 0 },
      { id: "a", position: 1 },
      { id: "c", position: 2 },
    ]);
    expect(hasPhotoChanges(c)).toBe(true);
  });

  it("새 사진을 대표로 — 새 사진도 놓인 자리로", () => {
    const rows = [saved("a", 0), saved("b", 1)];
    const c = photoChanges(rows, toFront([...draftOf(rows), picked("n1")], 2));
    expect(c.added.map((a) => a.position)).toEqual([0]);
    expect(c.moves).toEqual([
      { id: "a", position: 1 },
      { id: "b", position: 2 },
    ]);
  });

  it("옮기지 않았으면 자리 값이 띄엄띄엄이어도 그대로 — 뺀 것 · 새 것만으로는 옮기지 않는다", () => {
    const rows = [saved("a", 0), saved("b", 3), saved("c", 7)];
    const draft = [...draftOf(rows).filter((d) => d.key !== "b"), picked("n1")];
    const c = photoChanges(rows, draft);
    expect(c.moves).toEqual([]);
    expect(c.added.map((a) => a.position)).toEqual([8]);
  });

  it("다시 저장 — 올려 둔 새 사진은 열 때 없던 것으로 보아 옮긴 것으로 치지 않는다", () => {
    const rows = [saved("a", 0)];
    const up = { ...picked("n1"), saved: saved("x", 1) };
    expect(photoChanges(rows, [...draftOf(rows), up]).moves).toEqual([]);
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
    expect(video.video).toEqual({ duration: 12.4, posterAt: 1, local: null, cover: null });
  });

  it("새 영상은 읽은 값을 들고 올릴 것에 든다", () => {
    const c = photoChanges([], [picked("p"), pickedVideo("v")]);
    expect(c.added.map((a) => a.video?.duration ?? null)).toEqual([null, 12]);
    expect(c.added[1].video?.local?.src).toBe("blob:v");
  });
});

describe("표지 바꾸기", () => {
  it("저장된 영상 — 바꾼 표지 · 장면이 할 일에 든다. 사진에는 아무것도 하지 않는다", () => {
    const row = { ...saved("v", 0), video_key: "t/v.mp4", duration: 12, poster_at: 1 };
    const frame = new Blob(["f"]);
    const [video] = draftOf([row]);
    const next = withCover(video, 6.75, frame, "blob:f");
    expect(next.preview).toBe("blob:f");
    const c = photoChanges([row], [next]);
    expect(c.covers).toEqual([{ key: "v", row, poster: frame, posterAt: 6.75 }]);
    expect(hasPhotoChanges(c)).toBe(true);
    const photo = draftOf([saved("a", 0)])[0];
    expect(withCover(photo, 2, frame, "blob:f")).toBe(photo);
  });

  it("새 영상 — 올릴 표지 · 장면만 바뀌고 따로 바꿀 것은 없다", () => {
    const frame = new Blob(["f"]);
    const next = withCover(pickedVideo("n"), 4, frame, "blob:f");
    expect(next.video?.local?.poster).toBe(frame);
    const c = photoChanges([], [next]);
    expect(c.covers).toEqual([]);
    expect(c.added[0].video?.posterAt).toBe(4);
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

describe("readPicked", () => {
  /** 테스트용 읽기 — 이름이 bad 로 시작하면 받지 않고 그 이름을 까닭으로, 아니면 이름을 담아 받는다 */
  function read(file: File): Promise<{ name: string } | string> {
    return Promise.resolve(file.name.startsWith("bad") ? `${file.name} 거절` : { name: file.name });
  }

  /** 테스트용 파일 */
  function file(name: string): File {
    return new File([], name);
  }

  it("받지 못한 파일은 자리를 쓰지 않는다 — 자리가 하나여도 그 뒤의 파일이 들어온다", async () => {
    const r = await readPicked([file("bad1"), file("a")], 1, read);
    expect(r).toEqual({ picked: [{ name: "a" }], refused: "bad1 거절", overflow: false });
  });

  it("자리가 차면 남은 파일은 읽지 않고 넘쳤다고 알린다", async () => {
    const seen: string[] = [];
    const r = await readPicked([file("a"), file("b"), file("bad1")], 1, (f) => {
      seen.push(f.name);
      return read(f);
    });
    expect(r).toEqual({ picked: [{ name: "a" }], refused: null, overflow: true });
    expect(seen).toEqual(["a"]);
  });

  it("자리에 꼭 맞으면 넘치지 않았다 — 받지 못한 까닭은 마지막 것", async () => {
    const r = await readPicked([file("bad1"), file("a"), file("bad2"), file("b")], 2, read);
    expect(r).toEqual({
      picked: [{ name: "a" }, { name: "b" }],
      refused: "bad2 거절",
      overflow: false,
    });
  });

  it("자리가 없으면 하나도 읽지 않는다", async () => {
    expect(await readPicked([file("a")], 0, read)).toEqual({
      picked: [],
      refused: null,
      overflow: true,
    });
    expect(await readPicked([], 0, read)).toEqual({ picked: [], refused: null, overflow: false });
  });
});
