/**
 * IndexedDB 에 저장되는 쿼리 캐시의 「데이터 모양」을 정하는 파일들.
 * next.config.ts 가 이 파일들의 내용 해시를 persist buster 로 넘긴다. 이 중 하나라도 바뀐
 * 배포에서는 저장된 캐시를 복원하지 않고 버린다. 옛 모양 데이터가 새 코드에 그려져 깨지는 걸 막는다.
 *
 * 영속화 대상(shouldPersistQuery)의 조회 함수·반환 타입은 여기 잡히는 곳에만 둔다.
 * query-cache.config.test.ts 가 영속화 키를 쓰는 훅이 이 범위 밖에 생기면 실패한다.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/** 개별 파일 */
const FILES = ["src/shared/api/supabase/database.types.ts", "src/shared/lib/money/types.ts"];
/** 엔티티마다 이 세그먼트 안의 .ts (테스트 제외) */
const ENTITY_SEGMENTS = ["api", "model"];

export function queryCacheSources(root = process.cwd()) {
  const entities = path.join(root, "src/entities");
  const segmentFiles = readdirSync(entities).flatMap((slice) =>
    ENTITY_SEGMENTS.flatMap((segment) => {
      const dir = path.join(entities, slice, segment);
      if (!existsSync(dir)) return [];
      return readdirSync(dir)
        .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
        .map((f) => path.relative(root, path.join(dir, f)));
    }),
  );
  return [...FILES, ...segmentFiles].sort();
}

/** 위 파일들의 경로와 내용으로 만든 짧은 해시 */
export function queryCacheHash(root = process.cwd()) {
  const hash = createHash("sha1");
  for (const file of queryCacheSources(root)) {
    hash
      .update(file)
      .update("\0")
      .update(readFileSync(path.join(root, file)))
      .update("\0");
  }
  return hash.digest("hex").slice(0, 8);
}
