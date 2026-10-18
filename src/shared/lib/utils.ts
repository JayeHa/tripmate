import { createCn } from "cn/config";

/**
 * 클래스 합치기(clsx + tailwind-merge). 이 테마의 모서리 · 그림자 이름(globals.css 의 `--radius-*` · `--shadow-*`)을 알려 둔다 —
 * 모르면 `rounded-sheet` 와 뒤에 준 `rounded-none` 이 둘 다 남고, CSS 순서상 `rounded-sheet` 가 이겨서 덮어쓰기가 듣지 않는다.
 * 새 모서리 · 그림자 토큰을 만들면 여기에도 더한다. `cn` 패키지를 직접 가져오지 말고 이것을 쓴다(eslint)
 */
export const cn = createCn({
  extend: {
    theme: {
      radius: ["tag", "pill-sm", "button", "memo", "card", "sheet"],
      shadow: ["card", "sheet"],
    },
  },
});
