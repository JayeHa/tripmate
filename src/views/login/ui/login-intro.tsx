import { cn } from "@/shared/lib/utils";
import { Wordmark } from "@/shared/ui/wordmark";

type LoginIntroProps = { layout: "mobile" | "desktop" };

/** 워드마크 + 소개 카피. 모바일(7a)과 PC(7b)는 크기와 줄바꿈만 다르다. */
export function LoginIntro({ layout }: LoginIntroProps) {
  const mobile = layout === "mobile";
  return (
    <>
      <Wordmark
        className={cn("leading-none tracking-[-0.04em]", mobile ? "text-[44px]" : "text-4xl")}
      />
      <p
        className={cn(
          "leading-[1.45] font-bold text-ink-900",
          mobile ? "text-[19px] tracking-[-0.01em]" : "text-lg",
        )}
      >
        {mobile ? (
          <>
            함께 가는 여행,
            <br />
            일정부터 가계부까지 한 곳에서.
          </>
        ) : (
          "함께 가는 여행, 일정부터 가계부까지 한 곳에서."
        )}
      </p>
      <p className={cn("text-ink-400", mobile ? "text-[15px]/normal" : "pb-5 text-sm")}>
        일행과 지도·메모·지출을 같이 정리해요.
      </p>
    </>
  );
}
