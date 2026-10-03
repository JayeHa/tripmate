import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DIR = path.resolve(__dirname, "migrations");

/**
 * `security definer` 함수는 호출자 권한을 무시해서 RLS 가 걸리지 않는다.
 * 함수 안의 검사가 유일한 경계이므로, 익명(둘러보기) 계정을 받아도 되는지
 * 함수마다 정해 둔다. 새 함수를 만들면 여기에 추가해야 테스트가 통과한다.
 *
 * 판단 기준은 「남의 데이터에 흔적을 남기는가」다. 익명 계정은 복구 수단이 없어서
 * 쿠키가 지워지면 사라진다. 남의 여행에 멤버로 들어가는 동작은 막아야 한다.
 */
const ANONYMOUS_ALLOWED: Record<string, string> = {
  get_trip_preview: "읽기 전용 미리보기. 남기는 흔적이 없다",
  rotate_invite_token: "is_trip_member 로 걸러진다",
  is_trip_member: "판정 함수 자체",
  handle_new_user: "auth.users 트리거. 익명 가입도 profiles 가 필요하다",
  handle_new_trip: "trips 트리거. 소유자를 멤버로 넣는다. 둘러보기가 이것 없이는 동작하지 않는다",
};

/** 익명을 거부한다고 인정하는 형태. 주석이나 허용 조건에 걸리지 않게 좁게 본다. */
const REJECTS_ANONYMOUS = /if\s+[^;]*is_anonymous[^;]*then\s+raise\s+exception/i;

function sqlFiles() {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(path.join(DIR, f), "utf8"));
}

/**
 * 함수 정의를 통째로 집는다. `create function` 과 `create or replace function`,
 * `public.` 생략, `$$` 외의 달러 인용 태그를 모두 받는다.
 * 여는 태그를 캡처해 같은 태그로 끝을 찾아야 다른 함수의 본문을 끌어오지 않는다.
 */
const DEFINITION =
  /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)\s*\([\s\S]*?\$(\w*)\$([\s\S]*?)\$\2\$/gi;

function definitions() {
  const found = new Map<string, string>();
  for (const sql of sqlFiles()) {
    for (const m of sql.matchAll(DEFINITION)) {
      // 뒤 정의가 앞을 덮는다. 0004 가 0001 의 join_trip_by_token 을 교체하는 식이다.
      found.set(m[1], m[0]);
    }
  }
  return found;
}

const securityDefiner = () =>
  [...definitions()].filter(([, body]) => /security\s+definer/i.test(body));

describe("security definer 함수의 익명 계정 처리", () => {
  it("정규식이 security definer 정의를 하나도 놓치지 않는다", () => {
    // 정규식이 못 집는 형태로 함수가 추가되면 아래 개별 검사가 통째로 건너뛰어진다.
    // 단순 등장 횟수와 대조해서 그런 사각지대를 드러낸다.
    // 같은 함수를 뒤 마이그레이션이 교체하면 등장은 여러 번이므로 파일별로 세고 더한다.
    let occurrences = 0;
    for (const sql of sqlFiles()) {
      occurrences += sql.match(/security\s+definer/gi)?.length ?? 0;
    }
    let matched = 0;
    for (const sql of sqlFiles()) {
      for (const m of sql.matchAll(DEFINITION)) {
        if (/security\s+definer/i.test(m[0])) matched += 1;
      }
    }
    expect(matched).toBe(occurrences);
  });

  it.each(securityDefiner().map(([name]) => name))("%s 의 익명 허용 여부가 정해져 있다", (name) => {
    const body = definitions().get(name) ?? "";
    const rejects = REJECTS_ANONYMOUS.test(body);
    const allowed = name in ANONYMOUS_ALLOWED;
    // 둘 중 하나는 참이어야 한다. 아무 판단도 없는 함수가 조용히 늘어나는 걸 막는다.
    expect(rejects || allowed).toBe(true);
  });
});
