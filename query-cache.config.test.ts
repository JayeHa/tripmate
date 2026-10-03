import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { queryCacheHash, queryCacheSources } from "./query-cache.config.mjs";

const ROOT = __dirname;

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
}

/** shouldPersistQuery 가 남기는 키를 쓰는 곳. trips.* · scheduleItems · expenses · cities (경로 제외) */
const PERSISTED_KEY = /queryKeys\.(trips\.\w+|scheduleItems|expenses|cities)\b/;

describe("query-cache.config", () => {
  it("영속화되는 쿼리의 훅은 해시 대상 파일 안에 있다", () => {
    // 범위 밖에서 영속화 키로 useQuery 를 만들면, 그 파일이 바뀌어도 캐시가 버려지지 않는다.
    const sources = new Set(queryCacheSources(ROOT));
    const hooks = filesUnder(path.join(ROOT, "src"))
      .filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts"))
      .filter((f) => {
        const text = readFileSync(f, "utf8");
        return /useQuery\(|useSuspenseQuery\(/.test(text) && PERSISTED_KEY.test(text);
      })
      .map((f) => path.relative(ROOT, f));
    // 검사가 아무것도 못 찾고 통과하지 않게 알려진 훅이 잡히는지 본다
    expect(hooks).toContain("src/entities/trip/model/use-trip.ts");
    expect(hooks.filter((f) => !sources.has(f))).toEqual([]);
  });

  it("대상 파일 내용이 바뀌면 해시가 바뀐다", () => {
    const root = mkdtempSync(path.join(tmpdir(), "qc-"));
    const write = (rel: string, text: string) => {
      mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      writeFileSync(path.join(root, rel), text);
    };
    write("src/shared/api/supabase/database.types.ts", "a");
    write("src/shared/lib/money/types.ts", "b");
    write("src/entities/trip/api/trips.ts", "c");
    write("src/entities/trip/api/trips.test.ts", "test");
    write("src/entities/trip/ui/row.tsx", "ui");

    const before = queryCacheHash(root);
    write("src/entities/trip/ui/row.tsx", "ui changed");
    write("src/entities/trip/api/trips.test.ts", "test changed");
    expect(queryCacheHash(root)).toBe(before); // UI·테스트는 모양과 무관

    write("src/entities/trip/api/trips.ts", "c changed");
    expect(queryCacheHash(root)).not.toBe(before);
  });
});
