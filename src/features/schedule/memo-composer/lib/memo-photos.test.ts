import { describe, expect, it } from "vitest";

import {
  type DraftMemoPhoto,
  draftPhotosOf,
  droppedKeys,
  photoFileKeys,
  photosChanged,
} from "./memo-photos";

/** 저장된 사진 n 번 */
const saved = (n: number) => ({ photo_key: `t/p${n}.jpg`, thumb_key: `t/t${n}.jpg` });

/** 방금 고른 사진 */
const picked = (id: string): DraftMemoPhoto => ({
  id,
  saved: null,
  file: new File(["x"], `${id}.jpg`, { type: "image/jpeg" }),
  preview: `blob:${id}`,
});

describe("photosChanged", () => {
  const initial = draftPhotosOf([saved(0), saved(1)]);

  it("그대로면 false", () => {
    expect(photosChanged(initial, draftPhotosOf([saved(0), saved(1)]))).toBe(false);
  });

  it("새로 고르거나 · 빼거나 · 순서를 바꾸면 true", () => {
    expect(photosChanged(initial, [...initial, picked("n")])).toBe(true);
    expect(photosChanged(initial, initial.slice(1))).toBe(true);
    expect(photosChanged(initial, [initial[1], initial[0]])).toBe(true);
  });
});

describe("droppedKeys", () => {
  it("저장 뒤에 없는 사진의 두 키만", () => {
    expect(droppedKeys([saved(0), saved(1)], [saved(1), saved(2)])).toEqual([
      "t/p0.jpg",
      "t/t0.jpg",
    ]);
    expect(droppedKeys([saved(0)], [saved(0)])).toEqual([]);
  });
});

describe("photoFileKeys", () => {
  it("사진마다 두 키", () => {
    expect(photoFileKeys([saved(0), saved(1)])).toEqual([
      "t/p0.jpg",
      "t/t0.jpg",
      "t/p1.jpg",
      "t/t1.jpg",
    ]);
  });
});
