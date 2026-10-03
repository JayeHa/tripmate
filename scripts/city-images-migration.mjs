// public/city-images 의 도시 대표 사진을 cities.image_path 에 반영하는 마이그레이션을 만든다.
//
//   pnpm cities:images        → supabase/migrations/NNNN_city_images.sql 생성 → supabase db push
//
// - 파일 이름은 도시 id 로 시작한다: tokyo.webp, chiang-mai.webp (0006_cities.sql 의 id).
//   첫 '.' 앞이 id 다. 사진을 바꿀 땐 이름을 바꾼다(tokyo.2.webp). 같은 경로에 덮어쓰면
//   브라우저·next/image 캐시가 옛 사진을 계속 보여 준다.
// - 폴더 전체를 기준으로 모든 도시를 다시 쓴다. 파일을 지우면 그 도시는 null(틴트)로 돌아간다.
// - 썸네일은 최대 330px 너비라 webp 50~100KB 면 충분하다. 큰 파일은 경고한다.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const IMAGES = path.resolve("public/city-images");
const MIGRATIONS = path.resolve("supabase/migrations");
const EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif"]);
const WARN_BYTES = 150 * 1024;

const seed = readFileSync(path.join(MIGRATIONS, "0006_cities.sql"), "utf8");
const ids = [...seed.matchAll(/^\s*\('([a-z-]+)', '(?:abroad|domestic)'/gm)].map((m) => m[1]);

const files = existsSync(IMAGES) ? readdirSync(IMAGES).filter((f) => EXT.has(path.extname(f))) : [];
const byId = new Map();
for (const file of files.sort()) {
  const id = file.split(".")[0];
  if (!ids.includes(id)) {
    console.warn(`건너뜀: ${file} — 그런 도시 id 가 없습니다`);
    continue;
  }
  if (byId.has(id)) {
    console.error(`중복: ${id} — ${byId.get(id)} 와 ${file}. 하나만 남기세요.`);
    process.exit(1);
  }
  const size = statSync(path.join(IMAGES, file)).size;
  if (size > WARN_BYTES) console.warn(`큼: ${file} ${Math.round(size / 1024)}KB`);
  byId.set(id, file);
}

const q = (s) => `'${s.replace(/'/g, "''")}'`;
const lines = ids.map(
  (id) =>
    `update public.cities set image_path = ${
      byId.has(id) ? q(`/city-images/${byId.get(id)}`) : "null"
    } where id = ${q(id)};`,
);

const last = readdirSync(MIGRATIONS)
  .map((f) => Number(f.split("_")[0]))
  .filter(Number.isFinite)
  .reduce((a, b) => Math.max(a, b), 0);
const out = path.join(MIGRATIONS, `${String(last + 1).padStart(4, "0")}_city_images.sql`);
writeFileSync(
  out,
  `-- pnpm cities:images 로 생성. public/city-images 의 사진을 도시 대표 사진으로 잇는다.\n${lines.join("\n")}\n`,
);

const missing = ids.filter((id) => !byId.has(id));
console.log(
  `${path.relative(process.cwd(), out)} 생성: 사진 ${byId.size}개, 없음 ${missing.length}개`,
);
if (missing.length) console.log(`사진 없는 도시: ${missing.join(", ")}`);
