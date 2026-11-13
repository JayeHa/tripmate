/** 영상으로 받는 종류 — 원본 그대로 올린다. 버킷 `allowed_mime_types` 와 같다(0089) */
export const VISIT_VIDEO_MIMES = ["video/mp4", "video/quicktime", "video/webm"] as const;

/** 한 개 최대 크기(50MB) — 버킷 `file_size_limit` 와 같다(0089) */
export const VISIT_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

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
