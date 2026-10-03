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
  // set_updated_at 은 security definer 가 아니라 여기 없어도 된다.
};

/** 마이그레이션 전체에서 security definer 함수 이름을 뽑는다. 뒤 정의가 앞을 덮는다. */
function securityDefinerFunctions() {
  const found = new Map<string, string>();
  for (const file of readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(path.join(DIR, file), "utf8");
    // 함수 정의 하나씩 끊어서 본다. `$$;` 를 넘어가면 다른 함수의 security definer 를
    // 끌어다 붙여서 엉뚱한 함수가 잡힌다.
    const re = /create\s+or\s+replace\s+function\s+public\.(\w+)([\s\S]*?)\$\$;/g;
    for (const m of sql.matchAll(re)) {
      if (/security\s+definer/.test(m[2])) found.set(m[1], m[2]);
    }
  }
  return found;
}

describe("security definer 함수의 익명 계정 처리", () => {
  const functions = [...securityDefinerFunctions()];

  it("함수를 하나 이상 찾는다", () => {
    expect(functions.length).toBeGreaterThan(0);
  });

  it.each(functions.map(([name]) => name))("%s 의 익명 허용 여부가 정해져 있다", (name) => {
    const body = securityDefinerFunctions().get(name) ?? "";
    const rejectsAnonymous = body.includes("is_anonymous");
    const explicitlyAllowed = name in ANONYMOUS_ALLOWED;
    // 둘 중 하나는 참이어야 한다. 아무 판단도 없는 함수가 조용히 늘어나는 걸 막는다.
    expect(rejectsAnonymous || explicitlyAllowed).toBe(true);
  });
});
