import {
  deleteVisitPhotoRow,
  insertVisitPhoto,
  removeVisitMediaFiles,
  updateVisitPhotoCaption,
  uploadVisitPhoto,
  uploadVisitVideo,
  type VisitMediaKeys,
  type VisitPhoto,
} from "@/entities/schedule-item";

import type { PhotoChanges } from "../lib/photo-draft";

type Added = PhotoChanges["added"][number];

/** 올려 둔 새 사진 · 영상 — 놓을 값과 줄에 적을 파일 값 */
export type UploadedPhoto = Added & VisitMediaKeys;

/** 새 것 하나를 올린다 — 사진은 줄여서, 영상은 원본과 표지를 */
async function uploadOne(tripId: string, a: Added): Promise<VisitMediaKeys> {
  const local = a.video?.local;
  if (a.video && local) {
    const { duration, posterAt } = a.video;
    return uploadVisitVideo(tripId, a.file, { duration, posterAt, poster: local.poster });
  }
  const keys = await uploadVisitPhoto(tripId, a.file);
  return { ...keys, video_key: null, duration: null, poster_at: null };
}

/**
 * 새 사진 · 영상을 하나씩 올린다 — 하나라도 실패하면 이번에 올린 파일을 지우고 던진다.
 * onProgress 는 하나 올릴 때마다 지금까지 올린 수
 */
export async function uploadAdded(
  tripId: string,
  added: readonly Added[],
  onProgress: (done: number) => void,
): Promise<UploadedPhoto[]> {
  const done: UploadedPhoto[] = [];
  try {
    for (const a of added) {
      done.push({ ...a, ...(await uploadOne(tripId, a)) });
      onProgress(done.length);
    }
    return done;
  } catch (e) {
    await removeVisitMediaFiles(tripId, done);
    throw e;
  }
}

/**
 * 줄을 고친다 — 지우기 → 설명 → 넣기(붙인 줄마다 onSaved). 끝나면(실패해도) 지운 줄의 파일과 붙이지 못한 새 파일을 지운다
 */
export async function applyPhotoRows(
  target: { tripId: string; itemId: string },
  changes: PhotoChanges,
  uploaded: readonly UploadedPhoto[],
  onSaved: (key: string, row: VisitPhoto) => void,
): Promise<void> {
  const left = [...uploaded];
  const gone: VisitPhoto[] = [];
  try {
    for (const p of changes.removed) {
      await deleteVisitPhotoRow(p.id);
      gone.push(p);
    }
    for (const c of changes.captions) await updateVisitPhotoCaption(c.id, c.caption);
    while (left.length > 0) {
      onSaved(left[0].key, await insertVisitPhoto({ ...target, ...left[0] }));
      left.shift();
    }
  } finally {
    await removeVisitMediaFiles(target.tripId, [...left, ...gone]);
  }
}
