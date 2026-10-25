/**
 * 화면 이동 전환의 종류 — `<Link transitionTypes>` · `router.push(href, { transitionTypes })` 에 넘긴다.
 * `shared/ui/page-transition.tsx` 가 종류마다 애니메이션을 고르고, 모양은 `globals.css` 「화면 전환」 에 있다.
 * - forward: 한 단계 안으로(여행 카드 → 여행, 비용 줄 → 상세). 모바일은 왼쪽으로 밀린다
 * - back: 한 단계 밖으로(← · ✕ · 저장 뒤 돌아가기). 모바일은 오른쪽으로 밀린다
 * - tab: 같은 층의 탭 사이. 겹쳐 바뀐다(크로스페이드)
 *
 * 종류를 주지 않은 이동(브라우저 뒤로 가기 · `router.back()` · 주소의 검색값만 바뀜)은 전환 없이 바로 바뀐다.
 * PC 는 forward · back 도 크로스페이드다
 * @see https://nextjs.org/docs/app/guides/view-transitions
 */
export const NAV = {
  forward: ["nav-forward"],
  back: ["nav-back"],
  tab: ["nav-tab"],
} satisfies Record<string, string[]>;
