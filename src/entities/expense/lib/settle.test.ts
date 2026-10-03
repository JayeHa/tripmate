import { describe, expect, it } from "vitest";

import { minimizeTransfers } from "./settle";

function flows(transfers: { from: string; to: string; amount: number }[]) {
  const f: Record<string, number> = {};
  for (const t of transfers) {
    f[t.from] = (f[t.from] ?? 0) - t.amount;
    f[t.to] = (f[t.to] ?? 0) + t.amount;
  }
  return f;
}

describe("minimizeTransfers", () => {
  it("returns nothing when balanced", () => {
    expect(minimizeTransfers({ a: 0, b: 0 }, 0)).toEqual([]);
  });

  it("two members → one transfer", () => {
    expect(minimizeTransfers({ a: 500, b: -500 }, 0)).toEqual([
      { from: "b", to: "a", amount: 500 },
    ]);
  });

  it("collapses chain A→B→C into A→C", () => {
    // A owes B 10, B owes C 10  =>  net: A -10, B 0, C +10
    expect(minimizeTransfers({ a: -10, b: 0, c: 10 }, 0)).toEqual([
      { from: "a", to: "c", amount: 10 },
    ]);
  });

  it("5 members: ≤ 4 transfers, flows match net, all positive", () => {
    const net = { a: 12000, b: -3000, c: 7000, d: -9500, e: -6500 };
    const ts = minimizeTransfers(net, 0);
    expect(ts.length).toBeLessThanOrEqual(4);
    for (const t of ts) expect(t.amount).toBeGreaterThan(0);
    const f = flows(ts);
    for (const [id, v] of Object.entries(net)) expect(f[id] ?? 0).toBe(v);
  });

  it("is deterministic regardless of key order", () => {
    const a = minimizeTransfers({ x: 100, y: -50, z: -50 }, 0);
    const b = minimizeTransfers({ z: -50, x: 100, y: -50 }, 0);
    expect(a).toEqual(b);
  });

  it("handles cents", () => {
    const ts = minimizeTransfers({ a: 3.34, b: -1.67, c: -1.67 }, 2);
    expect(ts).toEqual([
      { from: "b", to: "a", amount: 1.67 },
      { from: "c", to: "a", amount: 1.67 },
    ]);
  });
});
