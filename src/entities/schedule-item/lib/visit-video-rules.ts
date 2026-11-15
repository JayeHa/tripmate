/** 영상으로 받는 종류 — 원본 그대로 올린다. 버킷 `allowed_mime_types` 와 같다(0089) */
export const VISIT_VIDEO_MIMES = ["video/mp4", "video/quicktime", "video/webm"] as const;

/** 한 개 최대 크기(50MB) — 버킷 `file_size_limit` 와 같다(0089) */
export const VISIT_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

/** 한 개 최대 길이(초) — 화면에 보이는 값. 받는 범위는 `fitsVisitVideoLength` */
export const VISIT_VIDEO_MAX_SECONDS = 30;

const EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

/** 받는 종류인가 */
export function isVisitVideoMime(mime: string): boolean {
  return (VISIT_VIDEO_MIMES as readonly string[]).includes(mime);
}

/** 저장소 키 — `{여행 id}/{uuid}.{확장자}`. 사진 키(`visitPhotoKey`)와 같은 모양이고 버킷만 다르다 */
export function visitVideoKey(tripId: string, id: string, mime: string): string {
  return `${tripId}/${id}.${EXT[mime] ?? "mp4"}`;
}

/**
 * 받는 길이인가 — 폰이 30초로 찍은 영상이 30.0x 로 읽혀서 31초 미만까지 받는다(DB 검사와 같다, 0089).
 * 길이를 모르는 영상(NaN · Infinity — 녹화하며 만든 WebM)은 받지 않는다
 */
export function fitsVisitVideoLength(seconds: number): boolean {
  return seconds > 0 && seconds < VISIT_VIDEO_MAX_SECONDS + 1;
}

/** 처음 표지로 쓰는 지점(초) — 1초, 2초보다 짧은 영상은 가운데 */
export function defaultPosterAt(duration: number): number {
  return Math.min(1, duration / 2);
}

/** 영상 시간 글 — 「0:12」. 초 아래는 버린다 */
export function videoClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
