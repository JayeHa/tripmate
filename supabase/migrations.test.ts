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
  copy_places_on_leave:
    "trip_members 삭제 트리거. 나간 사람의 장소를 소유자 사본으로 바꿔 남의 여행에 흔적이 남지 않게 한다",
  can_attach_place:
    "판정 함수. 읽기만 한다. 익명도 자기 장소를 자기 여행에 붙여야 둘러보기가 동작한다",
  handle_new_user: "auth.users 트리거. 익명 가입도 profiles 가 필요하다",
  handle_new_trip: "trips 트리거. 소유자를 멤버로 넣는다. 둘러보기가 이것 없이는 동작하지 않는다",
};

/**
 * 거부는 공용 헬퍼 호출 한 줄로만 인정한다.
 * 각 함수가 조건을 직접 쓰면 `if not ...` 처럼 방향을 뒤집어도 검사기가 알 수 없다.
 * 조건의 정확성은 assert_not_anonymous 하나만 지키면 된다.
 */
const REJECTS_ANONYMOUS = /perform\s+public\.assert_not_anonymous\s*\(\s*\)/i;

/** `--` 와 `/* *\/` 주석을 지운다. 주석 속 코드가 검사를 통과시키면 안 된다. */
function stripComments(sql: string) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
}

function sqlFiles() {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => stripComments(readFileSync(path.join(DIR, f), "utf8")));
}

/**
 * 함수 정의를 머리부터 다음 `create` 또는 파일 끝까지 한 덩어리로 자른다.
 * 본문을 달러 인용으로 가정하면 `language sql as '...'` 처럼 따옴표 본문인 함수에서
 * lazy 매치가 다음 함수까지 넘어가 그 본문을 자기 것으로 가져간다.
 */
const HEAD = /create\s+(?:or\s+replace\s+)?function\s+(?:"?public"?\.)?"?(\w+)"?\s*\(/gi;

function definitions() {
  const found = new Map<string, string>();
  for (const sql of sqlFiles()) {
    const heads = [...sql.matchAll(HEAD)];
    heads.forEach((m, i) => {
      const end = i + 1 < heads.length ? heads[i + 1].index : sql.length;
      // 뒤 정의가 앞을 덮는다. 0005 가 0001 의 join_trip_by_token 을 교체하는 식이다.
      found.set(m[1], sql.slice(m.index, end));
    });
  }
  return found;
}

const securityDefiner = () =>
  [...definitions()].filter(([, body]) => /security\s+definer/i.test(body));

describe("security definer 함수의 익명 계정 처리", () => {
  it("정의를 하나도 놓치지 않는다", () => {
    // 못 집는 형태가 생기면 아래 개별 검사가 통째로 건너뛰어진다.
    // 단순 등장 횟수와 대조해서 그런 사각지대를 드러낸다.
    let occurrences = 0;
    for (const sql of sqlFiles()) occurrences += sql.match(/security\s+definer/gi)?.length ?? 0;

    let matched = 0;
    for (const sql of sqlFiles()) {
      const heads = [...sql.matchAll(HEAD)];
      heads.forEach((m, i) => {
        const end = i + 1 < heads.length ? heads[i + 1].index : sql.length;
        if (/security\s+definer/i.test(sql.slice(m.index, end))) matched += 1;
      });
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

/**
 * 헬퍼 본문을 통째로 고정한다.
 *
 * 방향을 정규식으로 보려 했더니 `if not`, `= false`, `is not true` 처럼 뒤집는
 * 방법이 끝없이 나왔다. 금지 목록은 무한하고 허용 목록은 유한하다.
 * 헬퍼는 하나뿐이고 바뀔 일이 거의 없으니 기대 본문과 정확히 같은지만 본다.
 * 일부러 바꾸려면 이 문자열도 같이 고쳐야 하고, 그때 방향을 다시 보게 된다.
 */
const EXPECTED_HELPER_BODY = `
begin
if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
raise exception 'anonymous account is not allowed here';
end if;
end
`;

/** 공백·대소문자 차이는 무시한다. 구조와 토큰만 비교한다. */
function normalize(sql: string) {
  return sql
    .toLowerCase()
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join("\n");
}

describe("assert_not_anonymous 헬퍼", () => {
  it("본문이 기대한 것과 정확히 같다", () => {
    const definition = definitions().get("assert_not_anonymous") ?? "";
    const body = definition.slice(definition.indexOf("$$") + 2, definition.lastIndexOf("$$"));
    expect(normalize(body)).toBe(normalize(EXPECTED_HELPER_BODY));
  });

  it("거부가 필요한 함수는 이 헬퍼를 쓴다", () => {
    expect(sqlFiles().join("\n")).toMatch(REJECTS_ANONYMOUS);
  });
});

/**
 * public 스키마에 만든 테이블 이름. `if not exists` · `unlogged` 를 건너뛰고, 다른 스키마(storage 등)는 뺀다.
 * 스키마를 안 쓰면 public 으로 본다. 따옴표 없는 이름은 Postgres 가 소문자로 바꾸므로 `PUBLIC.foo` 도 public 이다.
 * temp 테이블은 public 이 아니라 세션 전용 스키마(pg_temp)에 생겨서 뺀다.
 */
function tableNames(sql: string): string[] {
  const re =
    /create\s+(?:(unlogged|temp|temporary)\s+)?table\s+(?:if\s+not\s+exists\s+)?(?:"?(\w+)"?\.)?"?(\w+)"?/gi;
  return [...sql.matchAll(re)]
    .filter(
      ([, kind, schema]) =>
        !/^temp/i.test(kind ?? "") && (schema ?? "public").toLowerCase() === "public",
    )
    .map((m) => m[3]);
}

describe("tableNames", () => {
  it.each([
    ["create table public.places (", ["places"]],
    ["create table if not exists public.foo (", ["foo"]],
    ["create unlogged table public.bar (", ["bar"]],
    ["create temporary table baz (", []],
    ["create TABLE PUBLIC.upper (", ["upper"]],
    ['create table "public"."quoted" (', ["quoted"]],
    ["create table storage.objects (", []],
  ])("%s → %j", (sql, expected) => {
    expect(tableNames(sql)).toEqual(expected);
  });
});

describe("데이터 정책 문서(docs/policies/data-model.md)", () => {
  /**
   * 마이그레이션이 만든 테이블 · 함수가 문서에 모두 적혀 있는지. 새로 만들고 문서를 안 고치면 여기서 막힌다.
   * 이름이 `백틱` 으로 한 번이라도 나오면 된다 — 권한 · 동작을 제대로 적었는지는 리뷰가 본다.
   */
  it("마이그레이션의 테이블 · 함수를 모두 적는다", () => {
    const doc = readFileSync(path.resolve(__dirname, "../docs/policies/data-model.md"), "utf8");
    const names = new Set<string>();
    for (const sql of sqlFiles()) {
      for (const name of tableNames(sql)) names.add(name);
      for (const m of sql.matchAll(HEAD)) names.add(m[1]);
    }
    expect(names.size).toBeGreaterThan(10);
    expect([...names].filter((name) => !doc.includes(`\`${name}\``))).toEqual([]);
  });
});
