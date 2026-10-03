<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 아키텍처 — Feature-Sliced Design

소스는 `src/` 아래 FSD 레이어로 나뉜다. 정의는 `fsd.config.mjs` 한 곳에 있고
`eslint.config.mjs` 와 `tests/fsd-structure.test.ts` 가 그걸 읽는다.

```
app > views > widgets > features > entities > shared
```

위에서 아래로만 import 한다. 같은 레이어에서는 자기 슬라이스 안에서만 참조한다.
`views` 는 FSD 의 pages 레이어다. Next 의 `app/` 과 겹쳐서 이름을 바꿨다.

**ESLint 가 이미 막아 주는 것** — 레이어 역방향 import, 같은 레이어의 슬라이스 간
import. 이 둘은 외우지 않아도 된다. `pnpm lint` 가 잡는다.

## 어디에 둘 것인가

|            | 기준                                                                                    |
| ---------- | --------------------------------------------------------------------------------------- |
| `shared`   | 도메인을 전혀 모르는 것. shadcn UI, `cn`, 날짜·화폐 계산, Supabase 클라이언트           |
| `entities` | 하나의 도메인 데이터와 그 CRUD. 타입 · zod 스키마 · 쿼리 함수 · TanStack 훅 · 표현형 UI |
| `features` | UI 와 동작을 함께 쥔 것. 뮤테이션을 직접 호출하거나 외부 API 를 부른다                  |
| `widgets`  | 둘 이상의 view 가 쓰는 자족 블록                                                        |
| `views`    | 라우트 하나에 대응하는 화면 조립                                                        |
| `app`      | Next 라우팅. `page.tsx` 는 view 를 렌더하는 서버 래퍼 한 줄                             |

소비자가 view 하나뿐인 컴포넌트는 widget 이 아니라 그 view 안에 둔다.
폼이 `onSubmit` 을 prop 으로만 받고 훅을 부르지 않으면 feature 가 아니라 entity 의 UI 다.

## 슬라이스 그룹

가까운 슬라이스를 폴더로 묶을 수 있다. 그룹은 **정리용일 뿐**이라 자체 코드나
공개 API 를 갖지 않고, 그룹 안의 슬라이스끼리도 서로 import 할 수 없다.

**새 슬라이스를 추가할 때 이 기준으로 판단한다.**

- 같은 도메인 슬라이스가 **3개 이상** 모이면 묶는다.
- 그룹 이름이 **그 안의 슬라이스 이름과 겹치면 아직 이르다.** `entities/expense/expense`
  가 되면 묶지 않는다. 형제 슬라이스가 생겨서 이름이 자연스러워질 때까지 기다린다.
- 그룹 안에서는 도메인 접두사를 뗀다. `features/trip/form` (`trip-form` 아님)

**그룹을 만들면 `fsd.config.mjs` 의 `GROUPS` 에 반드시 추가한다.** 적지 않으면 ESLint 가
그룹을 슬라이스로 착각해서 그룹 안의 교차 import 를 **조용히** 통과시킨다.
`tests/fsd-structure.test.ts` 가 누락과 그룹 폴더 안의 코드를 잡는다.

현재 `features` 만 그룹을 쓴다. `entities` 와 `views` 는 위 두 번째 기준에 걸려 보류 중이다.

## 배럴

슬라이스마다 `index.ts` 공개 API 를 두고 바깥에서는 그것만 import 한다.
슬라이스 내부끼리는 상대경로를 쓴다. 자기 배럴을 import 하면 순환이 생긴다.

**`server-only` 나 `next/headers` 를 쓰는 모듈은 배럴에 올리지 않는다.**
클라이언트 번들에 섞여 빌드가 깨진다. full path 로만 참조한다.
`shared/api/supabase` 는 그래서 배럴이 없다.
