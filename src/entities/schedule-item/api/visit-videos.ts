import { postJson } from "@/shared/api/post-json";
import { readVideoFrame } from "@/shared/lib/video-frame";

import { VISIT_PHOTO_SIDE } from "../lib/visit-photo-rules";
import {
  defaultPosterAt,
  fitsVisitVideoLength,
  isVisitVideoMime,
  VISIT_VIDEO_MAX_BYTES,
  VISIT_VIDEO_MAX_SECONDS,
} from "../lib/visit-video-rules";
import {
  removeVisitPhotoFiles,
  uploadVisitPhoto,
  type VisitMediaKeys,
  VisitPhotoError,
} from "./visit-photos";

/** 고른 영상에서 읽은 것 — 길이(초) · 표지 지점(초) · 표지 사진(JPEG) */
export type PickedVideo = { duration: number; posterAt: number; poster: Blob };

/** 영상 서명 주소 라우트를 부른다 — 영상 원본만 이 길로 다닌다(표지는 기록 사진 라우트) */
function callVideos<T>(body: Record<string, unknown>): Promise<T> {
  return postJson<T>("/api/visit-videos", body, "영상을 처리하지 못했어요");
}

/**
 * 고른 영상을 확인하고 표지를 만든다 — 종류 → 크기 → (읽어서) 길이. 받지 않으면 화면에 그대로 보일 문구로 던진다(VisitPhotoError).
 * src 는 그 파일의 object URL(부르는 쪽이 만들고 놓는다 — 미리 재생에도 쓴다).
 * 서버에서 바꾸지 않으므로 이 브라우저가 못 읽는 영상(코덱)은 받지 않는다 — 표지를 만들 수 없다
 */
export async function readVisitVideo(file: File, src: string): Promise<PickedVideo> {
  if (!isVisitVideoMime(file.type)) {
    throw new VisitPhotoError("이 영상 형식은 올릴 수 없어요 (MP4 · MOV · WebM)");
  }
  if (file.size > VISIT_VIDEO_MAX_BYTES) throw new VisitPhotoError("영상이 너무 커요 (50MB 까지)");
  const read = await readVideoFrame(src, defaultPosterAt, VISIT_PHOTO_SIDE);
  if (!read) throw new VisitPhotoError("이 영상은 올릴 수 없어요");
  if (!fitsVisitVideoLength(read.duration)) {
    throw new VisitPhotoError(`${VISIT_VIDEO_MAX_SECONDS}초 이하만 올릴 수 있어요`);
  }
  return { duration: read.duration, posterAt: read.at, poster: read.frame };
}

/** 영상 원본을 그대로 올린다 — 서명 주소를 받아 그 주소로 PUT. 키를 돌려준다 */
async function uploadFile(tripId: string, file: File): Promise<string> {
  const { key, url } = await callVideos<{ key: string; url: string }>({
    action: "upload",
    tripId,
    mime: file.type,
    size: file.size,
  });
  const put = await fetch(url, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!put.ok) throw new Error(`upload ${put.status}`);
  return key;
}

/**
 * 고른 영상 → 표지(사진처럼 긴 변 1600 + 썸네일 192)와 원본을 올리고 줄에 적을 키를 돌려준다. 줄은 아직 없다(`insertVisitPhoto`).
 * 표지를 먼저 올린다(작다). 원본이 실패하면 표지를 지우고 던진다
 */
export async function uploadVisitVideo(
  tripId: string,
  file: File,
  picked: PickedVideo,
): Promise<VisitMediaKeys> {
  const poster = new File([picked.poster], "poster.jpg", { type: "image/jpeg" });
  const keys = await uploadVisitPhoto(tripId, poster);
  try {
    const video_key = await uploadFile(tripId, file);
    return { ...keys, video_key, duration: picked.duration, poster_at: picked.posterAt };
  } catch (e) {
    await removeVisitPhotoFiles(tripId, [keys.photo_key, keys.thumb_key]);
    throw e;
  }
}

/**
 * 줄에 붙었던 파일을 지운다 — 사진 · 표지 · 썸네일은 사진 버킷, 영상 원본은 영상 버킷. 실패해도 던지지 않는다(#155).
 * 줄을 지운 뒤에 부른다(버킷은 붙은 줄이 없는 파일만 지운다)
 */
export async function removeVisitMediaFiles(
  tripId: string,
  media: readonly VisitMediaKeys[],
): Promise<void> {
  const videos = media.flatMap((m) => (m.video_key ? [m.video_key] : []));
  await Promise.all([
    removeVisitPhotoFiles(
      tripId,
      media.flatMap((m) => [m.photo_key, m.thumb_key]),
    ),
    videos.length > 0 &&
      callVideos({ action: "remove", tripId, keys: videos }).catch(() => undefined),
  ]);
}

/** 영상 원본을 잠깐 볼 수 있는 주소(1시간) — 재생할 때 받는다 */
export async function fetchVisitVideoUrl(tripId: string, key: string): Promise<string> {
  const { urls } = await callVideos<{ urls: Record<string, string> }>({
    action: "read",
    tripId,
    keys: [key],
  });
  if (!urls[key]) throw new Error("no video url");
  return urls[key];
}
