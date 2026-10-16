/** 캔버스를 파일로 — 만들지 못하면(메모리 부족 등) null */
export function canvasBlob(
  canvas: HTMLCanvasElement,
  type: "image/png" | "image/jpeg",
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** 다 쓴 캔버스의 메모리를 바로 돌려준다 — iOS Safari 는 캔버스 메모리 합이 작아 여러 장을 그리면 넘친다 */
export function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0;
  canvas.height = 0;
}
