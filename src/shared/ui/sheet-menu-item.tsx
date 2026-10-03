import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

type Props = Omit<ComponentProps<"button">, "type"> & {
  icon: LucideIcon;
  /** 아이콘 크기·색. 시트마다 시안 치수가 달라(여행 메뉴 22, 계정 메뉴 20) 호출부가 정한다. */
  iconClassName?: string;
  /** 삭제 · 로그아웃처럼 되돌리기 어려운 항목. 글자와 아이콘이 빨갛다. */
  danger?: boolean;
};

/** 바텀시트 안의 메뉴 한 줄. 높이 52, 아이콘 + 16/600 글자. */
export function SheetMenuItem({
  icon: Icon,
  iconClassName,
  danger,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-13 w-full items-center gap-3 text-left text-base font-semibold disabled:opacity-40",
        danger ? "text-destructive" : "text-ink-900",
        className,
      )}
      {...props}
    >
      <Icon className={cn("size-5 shrink-0", iconClassName)} />
      <span className="flex-1">{children}</span>
    </button>
  );
}
