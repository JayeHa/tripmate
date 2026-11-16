import {
  deleteVisitPhotoRow,
  insertVisitPhoto,
  removeVisitMediaFiles,
  removeVisitPhotoFiles,
  updateVisitPhotoCaption,
  updateVisitPhotoPosition,
  updateVisitVideoCover,
  uploadVisitCover,
  uploadVisitPhoto,
  uploadVisitVideo,
  type VisitMediaKeys,
  type VisitPhoto,
  type VisitPhotoKeys,
} from "@/entities/schedule-item";

import type { PhotoChanges } from "../lib/photo-draft";

type Added = PhotoChanges["added"][number];
type Cover = PhotoChanges["covers"][number];

/** 올려 둔 새 사진 · 영상 — 놓을 값과 줄에 적을 파일 값 */
export type UploadedPhoto = Added & VisitMediaKeys;

/** 올려 둔 새 표지 — 바꿀 영상과 새 표지 두 키 */
export type UploadedCover = Cover & VisitPhotoKeys;

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
 * 바꾼 표지를 하나씩 올린다 — onProgress 는 지금까지 올린 수.
 * 하나라도 실패하면 이번에 올린 표지와 앞서 올린 새 사진 · 영상(uploaded)을 지우고 던진다(줄은 아직 그대로)
 */
export async function uploadCovers(
  tripId: string,
  covers: readonly Cover[],
  uploaded: readonly UploadedPhoto[],
  onProgress: (done: number) => void,
): Promise<UploadedCover[]> {
  const done: UploadedCover[] = [];
  try {
    for (const c of covers) {
      done.push({ ...c, ...(await uploadVisitCover(tripId, c.poster)) });
      onProgress(done.length);
    }
    return done;
  } catch (e) {
    await Promise.all([
      removeVisitPhotoFiles(tripId, coverKeys(done)),
      removeVisitMediaFiles(tripId, uploaded),
    ]);
    throw e;
  }
}

/** 표지들의 두 키 */
function coverKeys(covers: readonly VisitPhotoKeys[]): string[] {
  return covers.flatMap((c) => [c.photo_key, c.thumb_key]);
}

/**
 * 줄을 고친다 — 지우기 → 설명 → 표지 → 순서 → 넣기(붙인 줄 · 표지를 바꾼 줄마다 onSaved).
 * 끝나면(실패해도) 지운 줄의 파일 · 바꾸기 전 표지 · 붙이지 못한 새 파일 · 붙이지 못한 새 표지를 지운다
 */
export async function applyPhotoRows(
  target: { tripId: string; itemId: string },
  changes: PhotoChanges,
  files: { uploaded: readonly UploadedPhoto[]; covers: readonly UploadedCover[] },
  onSaved: (key: string, row: VisitPhoto) => void,
): Promise<void> {
  const left = [...files.uploaded];
  const leftCovers = [...files.covers];
  const gone: VisitPhoto[] = [];
  const oldCovers: VisitPhotoKeys[] = [];
  try {
    for (const p of changes.removed) {
      await deleteVisitPhotoRow(p.id);
      gone.push(p);
    }
    for (const c of changes.captions) await updateVisitPhotoCaption(c.id, c.caption);
    while (leftCovers.length > 0) {
      const c = leftCovers[0];
      const { photo_key, thumb_key } = c;
      onSaved(
        c.key,
        await updateVisitVideoCover(c.row.id, { photo_key, thumb_key, poster_at: c.posterAt }),
      );
      oldCovers.push(c.row);
      leftCovers.shift();
    }
    for (const m of changes.moves) await updateVisitPhotoPosition(m.id, m.position);
    while (left.length > 0) {
      onSaved(left[0].key, await insertVisitPhoto({ ...target, ...left[0] }));
      left.shift();
    }
  } finally {
    await Promise.all([
      removeVisitMediaFiles(target.tripId, [...left, ...gone]),
      removeVisitPhotoFiles(target.tripId, coverKeys([...leftCovers, ...oldCovers])),
    ]);
  }
}
