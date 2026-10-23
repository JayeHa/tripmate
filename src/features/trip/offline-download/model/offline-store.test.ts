import { beforeEach, describe, expect, it, vi } from "vitest";

import { OFFLINE_TRIPS_KEY } from "@/shared/lib/offline-cache";

import type { SavedTrip } from "../lib/offline-plan";
import { allSavedTrips, setSavedTrip } from "./offline-store";

vi.mock("@/shared/api/offline-files", () => ({ dropOfflineTrip: vi.fn() }));

/** 테스트용 기기 저장소 — 키 하나만 쓰는 최소 대역 */
function stubStorage(): Map<string, string> {
  const map = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  });
  return map;
}

const done: SavedTrip = {
  status: "done",
  done: 1,
  total: 1,
  failed: [],
  missing: 0,
  savedAt: "2026-10-23T09:00:00.000Z",
  keepUntil: "2026-11-05",
};

describe("받은 기록 저장소", () => {
  let device: Map<string, string>;
  beforeEach(() => {
    device = stubStorage();
  });

  it("기기 값이 지워지면(로그아웃) 앞 사람의 기록을 다시 쓰지 않는다", () => {
    setSavedTrip("a", done);
    device.delete(OFFLINE_TRIPS_KEY);
    setSavedTrip("b", done);
    expect(Object.keys(JSON.parse(device.get(OFFLINE_TRIPS_KEY) ?? "{}") as object)).toEqual(["b"]);
  });

  it("기기 값이 그대로면 같은 객체를 돌려준다", () => {
    setSavedTrip("a", done);
    expect(allSavedTrips()).toBe(allSavedTrips());
  });
});
