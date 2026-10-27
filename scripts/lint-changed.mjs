/**
 * main 에서 바뀐 코드 파일만 경고 0 으로 린트한다. pre-push 와 CI(PR) 가 부른다.
 * 전체 `pnpm lint` 는 경고를 허용하므로, 손댄 파일에 남은 경고(긴 파일 · 복잡도)는 이 단계에서 정리하게 된다.
 * 손대지 않은 파일의 오래된 경고로는 실패하지 않는다.
 *
 * 비교 기준은 LINT_BASE(기본 origin/main) 와의 merge-base 다. CI 는 origin/<PR base> 를 넘긴다.
 */
import { execFileSync } from "node:child_process";

const base = process.env.LINT_BASE ?? "origin/main";

// -z: 한글 · 공백이 든 경로가 따옴표 · 8진 이스케이프(core.quotePath)로 바뀌지 않게 NUL 로 나눈다
const changed = execFileSync(
  "git",
  [
    "diff",
    "-z",
    "--name-only",
    "--diff-filter=ACMR",
    `${base}...HEAD`,
    "--",
    "*.ts",
    "*.tsx",
    "*.mts",
    "*.mjs",
  ],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);

if (changed.length === 0) {
  console.log(`lint:changed — ${base} 이후 바뀐 코드 파일이 없습니다`);
  process.exit(0);
}

console.log(`lint:changed — ${base} 이후 바뀐 파일 ${changed.length}개를 경고 0 으로 검사합니다`);
try {
  // 순환 검사는 전체 그래프를 보는 `pnpm lint:cycles`(CI 의 순환 작업)가 맡는다
  execFileSync(
    "pnpm",
    [
      "exec",
      "eslint",
      "--max-warnings",
      "0",
      "--no-warn-ignored",
      "--rule",
      "import/no-cycle: off",
      ...changed,
    ],
    { stdio: "inherit" },
  );
} catch {
  process.exit(1);
}
