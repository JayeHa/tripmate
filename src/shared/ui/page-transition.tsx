import { type ReactNode, ViewTransition } from "react";

/** 전환 종류 → 애니메이션 이름(`globals.css` 의 `::view-transition-*(.이름)`). 종류가 없으면 전환하지 않는다 */
const BY_TYPE = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  "nav-tab": "nav-tab",
  default: "none",
};

type PageTransitionProps = { children: ReactNode };

/**
 * 화면(page) 하나를 감싸 이동할 때 들어오고 나가는 애니메이션을 건다 — 종류는 링크가 정한다(`shared/lib/nav-transition.ts`).
 * 레이아웃은 이동해도 남아 있어 들어옴 · 나감이 일어나지 않으므로 `page.tsx` · `loading.tsx` 에서 감싼다.
 * 화면 안의 변화(데이터 도착 · 검색값만 바뀜)는 전환하지 않는다(`default="none"`).
 * View Transitions 를 모르는 브라우저(iOS 17 이하 등)에서는 애니메이션 없이 바로 바뀐다
 * @see https://react.dev/reference/react/ViewTransition
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <ViewTransition enter={BY_TYPE} exit={BY_TYPE} default="none">
      {children}
    </ViewTransition>
  );
}
