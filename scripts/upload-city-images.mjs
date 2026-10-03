// 도시 사진을 Supabase Storage(city-images)에 올리고 cities.image_path 를 채운다.
//
//   node --env-file=.env.local scripts/upload-city-images.mjs [폴더=./city-images]
//
// - 파일 이름이 도시 id 여야 한다: tokyo.jpg, chiang-mai.webp (0006_cities.sql 의 id)
// - .env.local 에 SUPABASE_SERVICE_ROLE_KEY 가 필요하다. 기준 데이터는 앱에서 쓸 수 없게
//   막아 두었으므로(RLS 쓰기 정책 없음) service role 로만 바꾼다. 이 키는 절대 커밋하지 않는다.
// - 버킷에는 `{id}-v{VERSION}.{확장자}` 로 올린다. 사진을 교체할 때는 VERSION 을 올려서
//   경로를 바꾼다. 같은 경로에 덮어쓰면 브라우저·next/image 캐시가 옛 사진을 계속 보여 준다.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "city-images";
const TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const VERSION = 1;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다 (.env.local).",
  );
  process.exit(1);
}

const dir = path.resolve(process.argv[2] ?? "city-images");
const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: cities, error } = await supabase.from("cities").select("id");
if (error) throw error;
const known = new Set(cities.map((c) => c.id));

let ok = 0;
for (const file of readdirSync(dir).sort()) {
  const ext = path.extname(file).toLowerCase();
  const id = path.basename(file, path.extname(file));
  if (!TYPES[ext]) continue;
  if (!known.has(id)) {
    console.warn(`건너뜀: ${file} — 그런 도시 id 가 없습니다`);
    continue;
  }
  const objectPath = `${id}-v${VERSION}${ext}`;
  const up = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, readFileSync(path.join(dir, file)), {
      contentType: TYPES[ext],
      upsert: true,
    });
  if (up.error) {
    console.error(`실패: ${file} — ${up.error.message}`);
    continue;
  }
  const set = await supabase.from("cities").update({ image_path: objectPath }).eq("id", id);
  if (set.error) {
    console.error(`실패: ${file} — ${set.error.message}`);
    continue;
  }
  ok += 1;
  console.log(`올림: ${id} → ${objectPath}`);
}

const missing = [...known].filter((id) => !readdirSync(dir).some((f) => f.startsWith(`${id}.`)));
console.log(`\n${ok}개 올림. 사진이 없는 도시 ${missing.length}개: ${missing.join(", ")}`);
