import { fitSize } from "./compress-image";

/** 읽은 영상 — 길이(초) · 뽑은 지점(초) · 그 장면(JPEG) */
export type VideoFrame = { duration: number; at: number; frame: Blob };

/** JPEG 품질 — 표지는 올릴 때 한 번 더 줄이므로 여기서는 높게 */
const QUALITY = 0.92;
/** 이만큼 기다려도 읽지 못하면 그만둔다 — 못 읽는 영상에서 이벤트가 끝내 오지 않는 브라우저가 있다 */
const TIMEOUT_MS = 15_000;

/** 지금 보이는 장면을 긴 변 maxSide 로 줄여 JPEG 으로. 그림이 없는 파일(소리만)이면 null */
function drawFrame(video: HTMLVideoElement, maxSide: number): Promise<Blob | null> {
  const { width, height } = fitSize(video.videoWidth, video.videoHeight, maxSide);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx || width === 0 || height === 0) return Promise.resolve(null);
  ctx.drawImage(video, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
}

/**
 * 영상의 길이를 읽고 한 장면을 JPEG 으로 뽑는다 — 화면 밖 video 로 그 지점을 찾아(seek) canvas 에 그린다.
 * at 은 길이를 받아 뽑을 지점(초)을 정한다. src 는 같은 출처여야 한다(고른 파일의 object URL) — 다른 출처면 canvas 를 읽지 못한다.
 * 브라우저가 그 영상을 못 읽거나(코덱), 길이를 모르거나(녹화하며 만든 WebM), 그림이 없으면 null
 */
export function readVideoFrame(
  src: string,
  at: (duration: number) => number,
  maxSide: number,
): Promise<VideoFrame | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    let point = 0;
    const timer = setTimeout(() => done(null), TIMEOUT_MS);

    /** 끝낸다 — 읽던 영상을 놓는다 */
    function done(result: VideoFrame | null) {
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      resolve(result);
    }

    video.onerror = () => done(null);
    video.onloadedmetadata = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return done(null);
      point = at(video.duration);
      video.currentTime = point;
    };
    video.onseeked = () => {
      const { duration } = video;
      void drawFrame(video, maxSide).then((frame) => done(frame && { duration, at: point, frame }));
    };
    video.src = src;
  });
}
