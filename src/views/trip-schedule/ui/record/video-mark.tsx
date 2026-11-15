import { videoClock } from "@/entities/schedule-item";

type VideoMarkProps = { duration: number };

/** 영상 썸네일 표시 — 가운데 ▶(22 · 어두운 원) + 오른쪽 아래 길이 「0:12」. 부모의 relative 칸 위에 얹는다 */
export function VideoMark({ duration }: VideoMarkProps) {
  return (
    <>
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 flex size-5.5 -translate-1/2 items-center justify-center rounded-full bg-[rgba(17,17,17,.55)] pl-0.5 text-[9px] text-white"
      >
        ▶
      </span>
      <span className="absolute right-0.75 bottom-0.75 rounded-tag bg-[rgba(17,17,17,.7)] px-0.75 text-[8px]/[13px] font-extrabold text-white tabular-nums">
        {videoClock(duration)}
      </span>
    </>
  );
}
