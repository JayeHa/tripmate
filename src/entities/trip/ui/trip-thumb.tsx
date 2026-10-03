import { cn } from "@/shared/lib/utils";
import { initialOf, tintOf } from "../lib/tint";

/** 여행 썸네일. 실제 사진으로 교체될 자리다. */
export function TripThumb({ title, className }: { title: string; className?: string }) {
  const { bg, fg } = tintOf(title);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-16 shrink-0 items-center justify-center rounded-full text-[22px] font-extrabold",
        className,
      )}
      style={{ backgroundColor: bg, color: fg }}
    >
      {initialOf(title)}
    </span>
  );
}
