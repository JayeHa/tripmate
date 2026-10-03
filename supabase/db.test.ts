import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * 마이그레이션을 실제 Postgres(PGlite, WASM)에 순서대로 적용하고 DB 함수·RLS 동작을 확인한다.
 * Supabase 가 주는 auth.uid() · 역할 · storage 는 최소 대역으로 흉내 낸다.
 * 원격과 다른 점: PostgREST 는 없다, 연결이 하나라 동시성은 못 본다.
 */
const DIR = path.resolve(__dirname, "migrations");
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";

let db: PGlite;

const STUBS = `
  create role anon; create role authenticated; create role service_role;
  create schema auth; create schema extensions; create schema storage;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('test.jwt', true), ''), '{}')::jsonb $$;
  create function extensions.gen_random_bytes(int) returns bytea language sql as
    $$ select decode(md5(random()::text), 'hex') $$;
  create table storage.buckets (id text primary key, name text, public boolean);
  create publication supabase_realtime;
`;

/**
 * Supabase 가 프로젝트에 미리 깔아 두는 기본 권한. 마이그레이션 **전에** 둬야
 * 마이그레이션 안의 revoke 가 덮이지 않고 살아남는다(원격과 같은 순서).
 */
const GRANTS = `
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

/** 이후 쿼리를 그 사용자로 실행한다 (RLS 적용) */
async function as(uid: string) {
  await db.exec(
    `reset role; select set_config('test.uid', '${uid}', false); set role authenticated;`,
  );
}

async function rejects(sql: string) {
  try {
    await db.query(sql);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

async function newTrip(start: string, end: string) {
  const { rows } = await db.query<{ id: string }>(
    `select public.create_trip('t', '${start}', '${end}', array['tokyo']) as id`,
  );
  return rows[0].id;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(STUBS);
  await db.exec(GRANTS);
  for (const file of readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(path.join(DIR, file), "utf8").replace(/create extension[^;]*;/gi, "");
    await db.exec(sql);
  }
  await db.exec(`insert into auth.users (id, email) values ('${A}', 'a@x'), ('${B}', 'b@x');`);
}, 30_000);

describe("create_trip", () => {
  it("여행 · 도시 순서 · 소유자 멤버를 한 번에 만든다", async () => {
    await as(A);
    const { rows } = await db.query<{ id: string }>(
      `select public.create_trip('도쿄·오사카 여행', '2026-11-01', '2026-11-03', array['tokyo','osaka']) id`,
    );
    const id = rows[0].id;
    const cities = await db.query(
      `select city_id from public.trip_cities where trip_id = '${id}' order by position`,
    );
    expect(cities.rows.map((r) => (r as { city_id: string }).city_id)).toEqual(["tokyo", "osaka"]);
    const member = await db.query(`select role from public.trip_members where trip_id = '${id}'`);
    expect(member.rows).toEqual([{ role: "owner" }]);
  });

  it("도시가 없거나 없는 도시면 거부하고 여행도 남기지 않는다", async () => {
    await as(A);
    const before = await db.query<{ n: number }>(`select count(*)::int n from public.trips`);
    expect(
      await rejects(`select public.create_trip('x', '2026-11-01', '2026-11-02', '{}')`),
    ).toMatch(/at least one city/);
    expect(
      await rejects(
        `select public.create_trip('x', '2026-11-01', '2026-11-02', array['atlantis'])`,
      ),
    ).toMatch(/foreign key/);
    const after = await db.query<{ n: number }>(`select count(*)::int n from public.trips`);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });
});

describe("update_trip_dates", () => {
  it("줄이면 잘린 날의 일정은 마지막 날 끝으로(순서 유지), 지출은 같이 옮기고 도착일로 모은다", async () => {
    await as(A);
    const id = await newTrip("2026-11-01", "2026-11-05");
    await db.exec(`
      insert into public.schedule_items (trip_id, day_index, position, name) values
        ('${id}',0,0,'a'),('${id}',2,0,'c'),('${id}',3,0,'d'),('${id}',3,1,'e'),('${id}',4,0,'f');
      insert into public.expenses (trip_id, payer_id, amount, currency, spent_on) values
        ('${id}','${A}',1,'KRW','2026-11-02'),('${id}','${A}',2,'KRW','2026-11-04');
      insert into public.day_routes (trip_id, day_index, items_hash, polyline, legs) values
        ('${id}',1,'h','p','[]'),('${id}',3,'h','p','[]');
    `);

    await db.query(`select public.update_trip_dates('${id}', '2026-11-10', '2026-11-12')`);

    const items = await db.query<{ v: string }>(
      `select day_index || ':' || position || ':' || name v from public.schedule_items
       where trip_id = '${id}' order by day_index, position`,
    );
    expect(items.rows.map((r) => r.v)).toEqual(["0:0:a", "2:0:c", "2:1:d", "2:2:e", "2:3:f"]);

    const expenses = await db.query<{ v: string }>(
      `select amount::int || '@' || spent_on v from public.expenses where trip_id = '${id}' order by amount`,
    );
    expect(expenses.rows.map((r) => r.v)).toEqual(["1@2026-11-11", "2@2026-11-12"]);

    const routes = await db.query<{ d: number }>(
      `select day_index d from public.day_routes where trip_id = '${id}'`,
    );
    expect(routes.rows.map((r) => r.d)).toEqual([1]);
  });

  it("거꾸로 된 기간과 멤버가 아닌 사람은 거부하고 아무것도 바꾸지 않는다", async () => {
    await as(A);
    const id = await newTrip("2026-12-01", "2026-12-03");
    expect(
      await rejects(`select public.update_trip_dates('${id}', '2026-12-05', '2026-12-01')`),
    ).toMatch(/end date/);

    await as(B);
    expect(
      await rejects(`select public.update_trip_dates('${id}', '2027-01-01', '2027-01-02')`),
    ).toMatch(/not a member/);

    await as(A);
    const trip = await db.query<{ s: string }>(
      `select start_date::text s from public.trips where id = '${id}'`,
    );
    expect(trip.rows[0].s).toBe("2026-12-01");
  });
});

describe("RLS", () => {
  it("도시 기준 데이터는 읽기만, 남의 여행에는 도시를 넣지 못한다", async () => {
    await as(A);
    const id = await newTrip("2027-02-01", "2027-02-02");
    await as(B);
    const read = await db.query<{ n: number }>(`select count(*)::int n from public.cities`);
    // 개수는 supabase/cities.test.ts 가 고정한다. 여기서는 읽힌다는 것만 본다
    expect(read.rows[0].n).toBeGreaterThan(0);
    expect(
      await rejects(
        `insert into public.cities (id, scope, name, position, lat, lng, country_code, currency, timezone)
         values ('x','domestic','x',0,0,0,'KR','KRW','Asia/Seoul')`,
      ),
    ).toMatch(/row-level security/);
    expect(await rejects(`insert into public.trip_cities values ('${id}', 'osaka', 1)`)).toMatch(
      /row-level security/,
    );
  });
});
