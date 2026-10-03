import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 도시 시드는 트리플 도시 선택 화면을 옮겨 적은 것이다. 손으로 고치다 행이 빠지거나
 * id 가 겹치면 FK 와 이미지 파일명이 어긋나므로 개수와 형태를 고정해 둔다.
 */
const sql = readFileSync(path.resolve(__dirname, "migrations/0006_cities.sql"), "utf8");

const ROW =
  /^\s*\('([a-z-]+)', '(abroad|domestic)', (null|'[a-z-]+'), '([^']+)', (array\[[^\]]*\]|'\{\}'), (null|'[^']*'), (\d+), (-?[\d.]+), (-?[\d.]+), (\d+), '([A-Z]{2})', '([A-Z]{3})', '([A-Za-z_]+\/[A-Za-z_]+)'\)[,;]$/gm;

const cities = [...sql.matchAll(ROW)].map((m) => ({
  id: m[1],
  scope: m[2],
  region: m[3] === "null" ? null : m[3].slice(1, -1),
  name: m[4],
  lat: Number(m[8]),
  lng: Number(m[9]),
}));

const regions = [...sql.matchAll(/^\s*\('([a-z-]+)', '[^']+', \d+\)[,;]$/gm)].map((m) => m[1]);

describe("도시 시드", () => {
  it("해외 92개, 국내 13개", () => {
    expect(cities.filter((c) => c.scope === "abroad")).toHaveLength(92);
    expect(cities.filter((c) => c.scope === "domestic")).toHaveLength(13);
  });

  it("id 와 이름이 겹치지 않는다", () => {
    expect(new Set(cities.map((c) => c.id)).size).toBe(cities.length);
    expect(new Set(cities.map((c) => c.name)).size).toBe(cities.length);
  });

  it("해외 도시는 정의된 권역에 속하고, 국내는 권역이 없다", () => {
    for (const c of cities) {
      if (c.scope === "abroad") expect(regions).toContain(c.region);
      else expect(c.region).toBeNull();
    }
  });

  it("좌표가 지구 위에 있다", () => {
    for (const c of cities) {
      expect(Math.abs(c.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(c.lng)).toBeLessThanOrEqual(180);
    }
  });
});
