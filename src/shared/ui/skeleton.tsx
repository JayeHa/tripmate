import { cn } from "@/shared/lib/utils";

/** 로딩 뼈대 한 칸 — 회색(#EEF0F2) · 모서리 6. 크기와 모양은 className 으로 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-pill-sm bg-skeleton", className)}
      {...props}
    />
  );
}

/**
 * 화면 하나의 로딩 뼈대를 감싼다 — 0.3초가 지나야 나타난다(빨리 끝나는 이동에서 깜빡이지 않게).
 * 그 전에는 빈 자리지만 헤더 · 탭은 레이아웃에 남아 눌린 탭이 바로 바뀐다. 화면 읽기 도구에는 「불러오는 중」 으로 알린다
 */
function SkeletonScreen({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div aria-busy="true" className={cn("animate-skeleton-in", className)} {...props}>
      <span role="status" className="sr-only">
        불러오는 중
      </span>
      {children}
    </div>
  );
}

export { Skeleton, SkeletonScreen };
