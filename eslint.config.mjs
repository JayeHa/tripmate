import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import { GROUPS, ORDER, SLICED } from "./fsd.config.mjs";

/**
 * FSD 레이어 경계. 위에서 아래로만 import 할 수 있고, 같은 레이어에서는
 * 자기 슬라이스 안에서만 참조할 수 있다. 레이어와 그룹 정의는 fsd.config.mjs 에 있다.
 *
 * eslint-plugin-boundaries v7 의 `policies` 문법은 이 조합에서 위반을 잡지 못해
 * (모든 의존을 조용히 통과시킨다) v5 계열 `rules` 문법을 쓴다. deprecation 경고가
 * 뜨지만 규칙이 실제로 동작하는 쪽을 택했다.
 */

/** 자기 자신(app·shared 는 레이어 전체, 나머지는 같은 슬라이스) + 아래 레이어 전부 */
function allowedFrom(layer) {
  const below = ORDER.slice(ORDER.indexOf(layer) + 1);
  const self = SLICED.includes(layer) ? [[layer, { slice: "${from.slice}" }]] : [layer];
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
                  capture: ["group", "slice"],
                },
              ]
            : [];
          const flatPattern = groups.length
            ? `src/${layer}/!(${groups.join("|")})/**/*`
            : `src/${layer}/*/**/*`;
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
  ]),
]);

export default eslintConfig;
