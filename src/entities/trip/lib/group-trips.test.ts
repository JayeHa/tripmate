import { describe, expect, it } from "vitest";
import { groupTrips } from "./group-trips";

const trip = (id: string, start: string, end: string) => ({ id, start_date: start, end_date: end });
const TODAY = "2026-10-03";

describe("groupTrips", () => {
  it("종료일을 기준으로 다가오는 것과 지난 것을 가른다", () => {
    const [upcoming, past] = groupTrips(
      [trip("future", "2026-10-31", "2026-11-04"), trip("past", "2026-05-29", "2026-05-31")],
      TODAY,
    );
    expect(upcoming.trips.map((t) => t.id)).toEqual(["future"]);
    expect(past.trips.map((t) => t.id)).toEqual(["past"]);
  });

  it("오늘 끝나는 여행은 아직 다가오는 쪽이다", () => {
    const [upcoming] = groupTrips([trip("ending", "2026-10-01", TODAY)], TODAY);
    expect(upcoming.title).toBe("다가오는 여행");
    expect(upcoming.trips).toHaveLength(1);
  });

  it("진행 중인 여행도 다가오는 쪽이다", () => {
    const [group] = groupTrips([trip("now", "2026-10-01", "2026-10-05")], TODAY);
    expect(group.title).toBe("다가오는 여행");
  });

  it("다가오는 것은 가까운 순", () => {
    const [upcoming] = groupTrips(
      [trip("later", "2026-12-01", "2026-12-03"), trip("sooner", "2026-10-31", "2026-11-04")],
      TODAY,
    );
    expect(upcoming.trips.map((t) => t.id)).toEqual(["sooner", "later"]);
  });

  it("지난 것은 최근 순", () => {
    const [past] = groupTrips(
      [trip("older", "2024-09-17", "2024-09-20"), trip("recent", "2026-05-29", "2026-05-31")],
      TODAY,
    );
    expect(past.trips.map((t) => t.id)).toEqual(["recent", "older"]);
  });

  it("빈 묶음은 섹션째 사라진다", () => {
    expect(groupTrips([trip("only", "2026-10-31", "2026-11-04")], TODAY)).toHaveLength(1);
    expect(groupTrips([], TODAY)).toEqual([]);
  });

  it("입력 배열을 건드리지 않는다", () => {
    const input = [trip("b", "2026-12-01", "2026-12-03"), trip("a", "2026-10-31", "2026-11-04")];
    groupTrips(input, TODAY);
    expect(input.map((t) => t.id)).toEqual(["b", "a"]);
  });
});
