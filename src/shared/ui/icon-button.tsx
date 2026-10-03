import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";

type Props = Omit<ComponentProps<"button">, "aria-label"> & {
  /** 보이는 글자가 없으니 스크린 리더용 이름을 반드시 받는다. */
  label: string;
};

/**
 * 아이콘 하나만 있는 버튼 (`···`, 뒤로 등). 크기·색·누르는 영역은 호출부가 정한다.
 * base-ui 트리거의 `render` 로도 넘길 수 있게 나머지 props 와 ref 를 그대로 전달한다.
 */
export function IconButton({ label, type = "button", className, ...props }: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-button outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}
