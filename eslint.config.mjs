import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";

/**
 * FSD 레이어 경계. 위에서 아래로만 import 할 수 있고, 같은 레이어에서는
 * 자기 슬라이스 안에서만 참조할 수 있다.
 *
 * eslint-plugin-boundaries v7 의 `policies` 문법은 이 조합에서 위반을 잡지 못해
 * (모든 의존을 조용히 통과시킨다) v5 계열 `rules` 문법을 쓴다. deprecation 경고가
 * 뜨지만 규칙이 실제로 동작하는 쪽을 택했다.
 */
const SLICED = ["views", "widgets", "features", "entities"];
const ORDER = ["app", ...SLICED, "shared"];

/**
 * 그룹된 슬라이스. 가까운 슬라이스를 폴더로 묶되 그룹 자체는 코드를 갖지 않고,
 * 그룹 안의 슬라이스끼리도 서로 import 할 수 없다 (FSD: slices-segments).
 *
 * 그룹을 여기에 적어야 하는 이유: 플러그인은 경로 모양만으로는
 * `<group>/<slice>/<segment>` 와 `<slice>/<segment>/<file>` 을 구분하지 못한다.
 * 적지 않으면 그룹 안의 교차 import 가 조용히 통과한다.
 */
const GROUPS = {
  features: ["auth", "trip", "schedule", "expense"],
};

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
