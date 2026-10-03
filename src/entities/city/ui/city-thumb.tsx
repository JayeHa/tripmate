import Image from "next/image";
import { CITY_IMAGES } from "@/shared/config/city-images";
import { cn } from "@/shared/lib/utils";
import { initialOf, tintOf } from "@/shared/lib/tint";

type Props = {
  city: { id: string; name: string };
  /** 원 지름(px). next/image sizes 와 글자 크기에 쓴다. */
  size: number;
  className?: string;
};

/** 도시 원 썸네일. 대표 사진이 있으면 사진, 없으면 첫 글자 + 틴트. */
export function CityThumb({ city, size, className }: Props) {
  const src = CITY_IMAGES[city.id];
  const { bg, fg } = tintOf(city.name);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-extrabold",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        backgroundColor: bg,
        color: fg,
      }}
    >
      {src ? (
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        initialOf(city.name)
      )}
    </span>
  );
}
