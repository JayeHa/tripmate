// pdf.js 가 그릴 때 따로 받는 파일(워커 · 글꼴 표 · 기본 글꼴 · wasm · 색 프로필)을 public/pdfjs/{버전}/ 에 복사한다.
// 버전 폴더라 패키지를 올려도 기기에 남은 옛 워커와 섞이지 않는다(메인과 워커 버전이 다르면 pdf.js 가 거부한다).
// 설치된 패키지에서 매번 복사하므로 저장소에는 올리지 않는다(.gitignore). dev · build 앞에 돈다(package.json).
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("pdfjs-dist/package.json"));
const { version } = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
const outRoot = join(root, "public", "pdfjs");
const out = join(outRoot, version);

if (!existsSync(join(out, "pdf.worker.min.mjs"))) {
  // 다른 버전 폴더는 지운다 — 쓰지 않는 파일이 배포에 쌓이지 않게
  rmSync(outRoot, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const dir of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
    cpSync(join(pkgDir, dir), join(out, dir), { recursive: true });
  }
  // 워커는 마지막에 — 「복사를 마쳤는가」 표시를 겸해서, 중간에 멈추면 다음 실행이 처음부터 다시 복사한다
  cpSync(join(pkgDir, "legacy/build/pdf.worker.min.mjs"), join(out, "pdf.worker.min.mjs"));
  console.log(`pdfjs-dist ${version} → public/pdfjs/${version}`);
}
