import { cn } from "@/lib/utils";

/** 로고 이미지가 없어 서비스명을 텍스트로만 표기한다 (design-system.md · Brand). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-extrabold tracking-[-0.03em] text-ink", className)}>tripmate</span>
  );
}
