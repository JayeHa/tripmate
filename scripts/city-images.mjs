// 도시 대표 사진 넣기. 사용법은 README 「도시 대표 사진 추가」.
//
//   1. city-images-inbox/ 에 원본을 넣는다. 이름은 도시 이름이나 id: 도쿄.jpg, tokyo.png
//   2. pnpm cities:images
//   3. 바뀐 public/city-images/ 와 src/shared/config/city-images.ts 를 커밋한다
//      (원본은 city-images-inbox/done/ 으로 옮겨진다. 커밋되지 않는다)
//
// 원본은 800px 너비 webp 로 줄여 public/city-images/{id}.{해시}.webp 에 둔다. 해시는 사진
// 내용에서 나오므로 사진을 바꾸면 경로도 바뀌어 캐시가 옛 사진을 보여 주지 않는다.
// 사진 목록(src/shared/config/city-images.ts)은 public/city-images 폴더를 기준으로 매번 다시 쓴다.
// 사진을 빼려면 그 파일을 지우고 inbox 를 비운 채 다시 실행한다.
import { createHash } from "node:crypto";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import sharp from "sharp";

const INBOX = path.resolve("city-images-inbox");
// 처리한 원본은 지우지 않고 여기로 옮긴다. 다시 줄이거나 잘라야 할 때 쓴다.
const DONE = path.join(INBOX, "done");
// inbox 의 안내 파일과 숨김 파일은 사진으로 보지 않는다.
const isNote = (f) => f.startsWith(".") || f === "README.md";
const OUT = path.resolve("public/city-images");
const MANIFEST = path.resolve("src/shared/config/city-images.ts");
const SEED = path.resolve("supabase/migrations/0006_cities.sql");

const WIDTH = 800; // 긴 변 기준. PC 카드 330px × 레티나 2배에 여유
const QUALITY = 75;
const WARN_BYTES = 150 * 1024;
const INPUT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

// 도시 id 와 이름은 시드에서 읽는다. 이름으로도 찾을 수 있게 한다(도쿄.jpg → tokyo).
const cities = [
  ...readFileSync(SEED, "utf8").matchAll(
    /^\s*\('([a-z-]+)', '(?:abroad|domestic)', [^,]+, '([^']+)'/gm,
  ),
].map((m) => ({ id: m[1], name: m[2] }));
// macOS 파일 이름의 한글은 자모가 풀린 NFD 로 온다. 비교 전에 NFC 로 합친다.
const key = (s) => s.normalize("NFC").trim().toLowerCase();
const byKey = new Map(
  cities.flatMap((c) => [
    [key(c.id), c],
    [key(c.name), c],
  ]),
);

mkdirSync(DONE, { recursive: true });
mkdirSync(OUT, { recursive: true });

const added = [];
for (const file of readdirSync(INBOX).sort()) {
  if (statSync(path.join(INBOX, file)).isDirectory()) continue;
  const ext = path.extname(file).toLowerCase();
  if (isNote(file)) continue;
  if (!INPUT.has(ext)) {
    console.warn(
      `건너뜀: ${file} — ${ext} 는 읽을 수 없어요 (jpg·png·webp·avif·tiff). HEIC 는 jpg 로 내보내 주세요`,
    );
    continue;
  }
  const city = byKey.get(key(path.basename(file, path.extname(file))));
  if (!city) {
    console.warn(
      `건너뜀: ${file} — 그런 도시가 없어요. 도시 이름(도쿄)이나 id(tokyo)로 지어 주세요`,
    );
    continue;
  }

  const webp = await sharp(path.join(INBOX, file))
    .rotate() // 사진의 EXIF 방향대로 세운다
    .resize({ width: WIDTH, height: WIDTH, fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
  const name = `${city.id}.${createHash("sha1").update(webp).digest("hex").slice(0, 8)}.webp`;

  // 같은 도시의 이전 사진은 지운다
  for (const old of readdirSync(OUT)) {
    if (old.startsWith(`${city.id}.`) && old !== name) rmSync(path.join(OUT, old));
  }
  writeFileSync(path.join(OUT, name), webp);
  renameSync(path.join(INBOX, file), path.join(DONE, file));

  const kb = Math.round(webp.length / 1024);
  added.push(`${city.name}(${city.id}) ${kb}KB`);
  if (webp.length > WARN_BYTES)
    console.warn(`큼: ${name} ${kb}KB — 원본을 더 잘라서 넣으면 줄어요`);
}

// 폴더 기준으로 사진 목록을 다시 쓴다
const ids = new Set(cities.map((c) => c.id));
const entries = readdirSync(OUT)
  .filter((f) => f.endsWith(".webp") && ids.has(f.split(".")[0]))
  .sort()
  .map((f) => `  "${f.split(".")[0]}": "/city-images/${f}",`);
writeFileSync(
  MANIFEST,
  `// pnpm cities:images 가 public/city-images 를 보고 만든다. 손으로 고치지 않는다.
/** 도시 id → 대표 사진 경로. 없는 도시는 첫 글자 + 틴트로 대신한다. */
export const CITY_IMAGES: Readonly<Record<string, string>> = {
${entries.join("\n")}
};
`,
);

console.log(
  added.length ? `추가: ${added.join(", ")}` : "inbox 가 비어 있어요. 사진 목록만 다시 썼어요.",
);
console.log(`사진 있는 도시 ${entries.length} / ${cities.length}`);
const stray = readdirSync(INBOX).filter(
  (f) => !isNote(f) && !statSync(path.join(INBOX, f)).isDirectory(),
);
if (stray.length) console.log(`inbox 에 남은 파일: ${stray.join(", ")}`);
