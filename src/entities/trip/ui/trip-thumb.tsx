import Image from "next/image";
import { cn } from "@/shared/lib/utils";
import { initialOf, tintOf } from "@/shared/lib/tint";

type Props = {
  title: string;
  /** 도시 사진. 없으면 제목 첫 글자 + 틴트 원으로 대신한다. */
  imageUrl?: string | null;
  className?: string;
  /** next/image 에 넘길 표시 크기(px). 원 지름과 맞춘다. */
  size?: number;
};

/** 여행 썸네일 원. */
export function TripThumb({ title, imageUrl, className, size = 64 }: Props) {
  const { bg, fg } = tintOf(title);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-[22px] font-extrabold",
        className,
      )}
      style={{ backgroundColor: bg, color: fg }}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        initialOf(title)
      )}
    </span>
  );
}
