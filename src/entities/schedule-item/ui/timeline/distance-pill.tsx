import { ArrowUpRight, TrainFront } from "lucide-react";

type DistancePillProps = { label: string; url: string };

/** 직전 장소에서 오는 길. 누르면 구글맵 대중교통 길찾기를 연다 */
export function DistancePill({ label, url }: DistancePillProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="구글맵에서 대중교통 경로 보기"
      className="inline-flex items-center gap-1 rounded-pill-sm border border-line bg-white py-0.75 pr-1.75 pl-1.5 text-[13px] font-semibold whitespace-nowrap text-ink-700"
    >
      <TrainFront className="size-3" strokeWidth={2.2} />
      {label}
      <span className="inline-flex items-center gap-px font-bold text-primary-pressed">
        경로
        <ArrowUpRight className="size-3" strokeWidth={2.4} />
      </span>
    </a>
  );
}
