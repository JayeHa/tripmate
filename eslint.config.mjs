import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import betterTailwind from "eslint-plugin-better-tailwindcss";
import boundaries from "eslint-plugin-boundaries";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

import { GROUPS, ORDER, SLICED } from "./fsd.config.mjs";

/**
 * FSD 레이어 경계. 위에서 아래로만 import 할 수 있고, 같은 레이어에서는
 * 자기 슬라이스 안에서만 참조할 수 있다. 레이어와 그룹 정의는 fsd.config.mjs 에 있다.
 *
 * eslint-plugin-boundaries v7 의 `policies` 문법은 이 조합에서 위반을 잡지 못해
 * (모든 의존을 조용히 통과시킨다) v5 계열 `rules` 문법을 쓴다. deprecation 경고가
 * 뜨지만 규칙이 실제로 동작하는 쪽을 택했다.
 */

/**
 * 자기 자신(app·shared 는 레이어 전체, 나머지는 같은 슬라이스) + 아래 레이어 전부.
 *
 * 그룹 안에서는 도메인 접두사를 떼므로 `trip/form` 과 `expense/form` 처럼 이름이 겹친다.
 * 그래서 그룹 슬라이스는 `slice` 대신 `group`·`groupedSlice` 를 캡처한다. 셀렉터의 캡처
 * 키가 대상에 없으면 불일치이므로 평면 슬라이스와 그룹 슬라이스가 서로 섞이지 않는다.
 */
function allowedFrom(layer) {
  const below = ORDER.slice(ORDER.indexOf(layer) + 1);
  const self = SLICED.includes(layer)
    ? [
        [layer, { slice: "${from.slice}" }],
        [layer, { group: "${from.group}", groupedSlice: "${from.groupedSlice}" }],
      ]
    : [layer];
  return [...self, ...below];
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**/*", mode: "full" },
        ...SLICED.flatMap((layer) => {
          const groups = GROUPS[layer] ?? [];
          const grouped = groups.length
            ? [
                {
                  type: layer,
                  pattern: `src/${layer}/(${groups.join("|")})/*/**/*`,
                  mode: "full",
                  capture: ["group", "groupedSlice"],
                },
              ]
            : [];
          const flatPattern = `src/${layer}/*/**/*`;
          return [
            ...grouped,
            { type: layer, pattern: flatPattern, mode: "full", capture: ["slice"] },
          ];
        }),
        { type: "shared", pattern: "src/shared/**/*", mode: "full" },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: ORDER.map((layer) => ({ from: layer, allow: allowedFrom(layer) })),
        },
      ],
    },
  },
  /**
   * 코드 규칙 (AGENTS.md 「코드 규칙」). 판단이 필요 없는 건 error, 나눌지 판단해야 하는 건 warn.
   */
  {
    rules: {
      "no-nested-ternary": "error",
      "max-depth": ["error", 3],
      "max-lines": ["warn", { max: 200, skipBlankLines: true, skipComments: true }],
      complexity: ["warn", 15],
    },
  },
  {
    // 생성 파일 · 데이터 · shadcn 원본 · 테스트는 길이가 책임과 무관하다
    files: [
      "src/shared/api/supabase/database.types.ts",
      "src/features/auth/demo-login/lib/tokyo-seed.ts",
      "src/shared/ui/**",
      "**/*.test.ts",
    ],
    rules: { "max-lines": "off" },
  },
  /**
   * import 규칙. 정렬과 type import 는 --fix 로 고쳐지므로 pre-commit 에서 자동 적용된다.
   */
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": [
        "error",
        // 부수 효과 → node · 외부 패키지 → @/ 레이어 → 상대경로
        { groups: [["^\\u0000"], ["^node:", "^@?\\w"], ["^@/"], ["^\\."]] },
      ],
      "simple-import-sort/exports": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "import/no-duplicates": ["error", { "prefer-inline": true }],
      // 배럴(index.ts)이 서로를 다시 내보내는 FSD 에서 생기기 쉽다
      "import/no-cycle": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // 다른 슬라이스는 공개 API(index.ts)로만. 같은 슬라이스 안은 상대경로를 쓴다.
              // server-only 모듈은 배럴에 올리지 않으므로 그 import 한 줄에만 disable 주석을 단다.
              group: ["@/views/*/*", "@/widgets/*/*", "@/entities/*/*", "@/features/*/*/*"],
              message:
                "다른 슬라이스는 index.ts 로만 import 합니다. 같은 슬라이스 안이면 상대경로를 쓰세요.",
            },
            {
              // 상대경로로 레이어 폴더까지 올라가면 다른 슬라이스(또는 레이어)다. 별칭 규칙을 우회하지 못하게 막는다.
              // 같은 슬라이스 안의 상대경로(../model/x, ../../lib/cta)는 레이어 이름을 지나지 않는다.
              regex: "^(\\.\\./)+(app|views|widgets|features|entities|shared)(/|$)",
              message: "다른 슬라이스·레이어는 `@/` 경로로 import 합니다.",
            },
          ],
        },
      ],
    },
  },
  /**
   * 타입 정보를 쓰는 규칙. 처리 안 된 Promise, 빠진 switch 분기, 늘 참인 조건처럼
   * 문법만 봐서는 모르는 버그를 잡는다. tsconfig 에 든 TS 파일만 대상이다.
   */
  {
    files: ["**/*.{ts,tsx,mts}"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      // no-unnecessary-condition 은 켜지 않는다. noUncheckedIndexedAccess 가 꺼져 있어 Record 조회와
      // 수기 DB 타입이 「늘 있음」으로 보이고, 규칙이 런타임에 필요한 검사(rates[c] 없음,
      // navigator.share 미지원)를 지우라고 한다. 그 옵션을 켠 뒤 다시 본다(#44).
      // 문자열의 || 는 빈 문자열을 null · 기본값으로 바꾸려는 의도라 ?? 로 바꾸지 않는다.
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: { string: true } },
      ],
    },
  },
  /**
   * React 스타일. eslint-config-next 가 이미 넣은 eslint-plugin-react 에서 골라 켠다.
   */
  {
    files: ["**/*.tsx"],
    rules: {
      "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
      "react/self-closing-comp": "error",
      "react/no-array-index-key": "error",
      "react/no-unstable-nested-components": "error",
      "react/jsx-boolean-value": "error",
      "react/jsx-curly-brace-presence": ["error", { props: "never", children: "never" }],
      // props 타입은 파라미터에 바로 쓰지 않고 이름을 붙여 따로 선언한다(AGENTS.md 코드 규칙)
      "no-restricted-syntax": [
        "error",
        ...[
          "FunctionDeclaration[id.name=/^[A-Z]/] > :matches(ObjectPattern, Identifier) > TSTypeAnnotation > TSTypeLiteral",
          "VariableDeclarator[id.name=/^[A-Z]/] > ArrowFunctionExpression > :matches(ObjectPattern, Identifier) > TSTypeAnnotation > TSTypeLiteral",
        ].map((selector) => ({
          selector,
          message: "컴포넌트 props 타입은 `type 컴포넌트이름Props = { … }` 로 따로 선언합니다.",
        })),
        {
          selector:
            "JSXOpeningElement[name.name='input'] > JSXAttribute[name.name='type'][value.value='time']",
          message: "브라우저 기본 시간 입력 대신 `@/shared/ui/time-field` 의 TimeField 를 씁니다.",
        },
      ],
      // 지금 코드의 관례: 이름 있는 컴포넌트는 function 선언
      "react/function-component-definition": [
        "error",
        { namedComponents: "function-declaration", unnamedComponents: "arrow-function" },
      ],
    },
  },
  /**
   * Tailwind 클래스. 정식 이름(size-[22px] → size-5.5)·충돌·중복·없는 클래스를 잡는다.
   * 순서와 줄바꿈은 포매터(prettier-plugin-tailwindcss) 몫이라 여기서 켜지 않는다.
   * cn · cva 안의 문자열도 검사한다(플러그인 기본값).
   */
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "better-tailwindcss": betterTailwind },
    // rootFontSize 가 있어야 px 임의값을 간격 단위로 바꿔 준다(size-[22px] → size-5.5)
    settings: { "better-tailwindcss": { entryPoint: "src/app/globals.css", rootFontSize: 16 } },
    rules: {
      // shorthand(translate-x + translate-y → translate) 도 이 규칙이 함께 잡는다
      "better-tailwindcss/enforce-canonical-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "error",
      // 끈다: rounded → rounded-sm 으로 자동 수정하는데, 이 프로젝트의 rounded-sm 은 shadcn 테마라
      // --radius × 0.6(6px)이고 rounded 는 4px 다. 자동 수정이 화면을 조용히 바꾼다.
      "better-tailwindcss/no-deprecated-classes": "off",
      "better-tailwindcss/no-unnecessary-whitespace": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-unknown-classes": "error",
    },
  },
  // Disable ESLint rules that conflict with Prettier (keep last).
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "design_handoff_tripmate/**",
    // pdf.js 워커 사본(scripts/copy-pdfjs.mjs)
    "public/pdfjs/**",
  ]),
]);

export default eslintConfig;
