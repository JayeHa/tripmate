import base from "./eslint.config.mjs";

/**
 * 기본 설정 한 덩어리에서 규칙을 비우고 타입 정보(projectService)를 끈다 — 파서 · 플러그인 · 리졸버 · 무시 목록은 그대로
 * @param {import("eslint").Linter.Config} config
 * @returns {import("eslint").Linter.Config}
 */
function withoutRules(config) {
  const copy = { ...config };
  delete copy.rules;
  const parserOptions = copy.languageOptions?.parserOptions;
  if (parserOptions?.projectService) {
    const options = { ...parserOptions };
    delete options.projectService;
    delete options.tsconfigRootDir;
    copy.languageOptions = { ...copy.languageOptions, parserOptions: options };
  }
  return copy;
}

/**
 * 순환 import 만 보는 설정 — `pnpm lint:cycles`(CI 의 「순환 검사」 작업).
 * import/no-cycle 은 모듈 그래프 전체를 따라가 혼자 린트 시간의 70% 를 쓴다. 나머지 규칙(`pnpm lint:rules`)과 나눠 동시에 돌린다.
 * 다른 규칙의 eslint-disable 주석이 「쓰이지 않음」 으로 잡히지 않게 그 보고는 끈다
 */
const cyclesConfig = [
  ...base.map(withoutRules),
  {
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: { "import/no-cycle": "error" },
  },
];

export default cyclesConfig;
