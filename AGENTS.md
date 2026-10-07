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
import, 다른 슬라이스 내부 파일 import(배럴 우회). 외우지 않아도 된다. `pnpm lint` 가 잡는다.

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
`shared/api/supabase` 는 그래서 배럴이 없다. 슬라이스 안의 서버 전용 모듈을 밖에서 쓸 때는
배럴 우회 규칙에 걸리므로 그 import 한 줄에 `eslint-disable-next-line no-restricted-imports`
와 이유를 단다(예: `app/api/routes/route.ts`).

## 테스트 위치

**테스트는 대상 파일 바로 옆에 둔다.** `tests/` 나 `__tests__/` 같은 별도 폴더를 만들지
않는다. `days.ts` 옆에 `days.test.ts`, `fsd.config.mjs` 옆에 `fsd.config.test.ts`.

대상과 같은 자리에 있으면 파일을 옮길 때 테스트가 따라가고, 테스트가 없는 모듈이
눈에 띈다. vitest 는 `**/*.test.ts` 로 수집하므로 위치 제약이 없다.

# 코드 규칙

린트로 잡을 수 있는 건 린트가 잡는다(`eslint.config.mjs`). 판단이 필요한 건 아래 기준을 따른다.

## 컴포넌트는 한 가지 일만

- **레이아웃이 다르면 컴포넌트를 나눈다.** 모바일과 PC 의 구조가 다르면 `if (layout === …)` 로
  한 함수에 두 화면을 그리지 않는다. 예: `features/trip/create/ui/{mobile,pc}`
- **상태와 이펙트는 훅(`model/use-*.ts`), 순수 계산은 `lib/` + 테스트.** 컴포넌트는 받은 것을 그린다.
  두 레이아웃이 같은 상태를 쓰면 훅을 상위(뷰)로 올려 하나만 둔다
- **파일이 200줄을 넘으면 나눌 신호다**(린트 경고). 생성 파일·데이터·shadcn 원본·테스트는 제외

## 분기는 읽히게

- **중첩 삼항 금지**(린트 오류). 대신 early return 하는 작은 함수, 조회 객체
  (`COPY[state.step]`, `NET_TONE[Math.sign(net)]`), 하위 컴포넌트
- **블록 중첩은 3단까지**(린트 오류). `try` 를 반복문 안에 넣지 말고 함수로 뺀다
- **함수 복잡도 15 초과는 경고.** 폼처럼 큰 컴포넌트가 걸리면 그 화면을 다시 만들 때 나눈다

## 주석

- **함수에는 `/** */` 설명을 단다.** 컴포넌트 · 훅 · 유틸 모두, 테스트 헬퍼도
- 간단한 함수는 한 줄로 무엇을 하는지만: `/** 좌표가 둘 다 있으면 그 좌표, 아니면 null */`
- 호출하는 쪽이 알아야 하는 것(빈 값의 의미 · 순서 의존 · 외부 제약 · 왜 이렇게 했는지)은 여러 줄로 남긴다
- **출처는 정확한 링크가 있을 때만 `@see` 로 단다.** 예: `@see https://developers.google.com/maps/...`.
  레포에 커밋되지 않거나 계속 바뀌는 자료(디자인 핸드오프 `README §19`, `design-system.md`, 시안 화면 번호 `5b`)는
  주석에 적지 않는다. 읽는 사람이 찾을 수 없고, 시안이 바뀌면 틀린 참조가 된다. 필요한 수치와 이유는 주석에 직접 쓴다

## props 타입

- **컴포넌트 props 타입은 `type 컴포넌트이름Props = { … }` 로 따로 선언한다**(린트 오류).
  파라미터에 `{ a }: { a: string }` 처럼 바로 쓰지 않는다. 훅·유틸의 객체 파라미터는 해당 없음
- 이름 있는 컴포넌트는 `function` 선언, 렌더 중에 컴포넌트를 정의하지 않는다, 배열 index 를 key 로 쓰지 않는다(린트)

## Promise

- **기다리지 않는 Promise 는 `void` 로 표시한다.** 예: `void qc.invalidateQueries(…)` — 빼먹으면 린트 오류
- 이벤트 핸들러·콜백에 async 함수를 넘길 땐 `onClick={() => void fn()}`. 실패를 삼키면 안 되는 곳이면 함수 안에서 처리한다
- `||` 와 `??`: 숫자·객체는 `??`(린트). **문자열은 `||` 를 허용한다** — 빈 문자열을 `null`·기본값으로 바꾸려는 의도가 많다

## Tailwind

- **정식 클래스를 쓴다.** `size-[22px]` 대신 `size-5.5` 처럼 간격 단위로 표현되는 값은 린트가 자동으로 고친다.
  `text-[13px]` 처럼 대응 클래스가 없는 임의값은 그대로
- 클래스 **순서**는 `prettier-plugin-tailwindcss` 가 정렬한다. 손으로 맞추지 않는다
- **`rounded`·`rounded-sm` 은 쓰지 않는다.** 이 테마의 `rounded-sm` 은 shadcn 값(`--radius × 0.6`)이라
  기본 Tailwind 와 다르다. 시안 값은 토큰으로: `rounded-tag`(4) · `rounded-pill-sm`(6) · `rounded-button`(8) ·
  `rounded-memo`(10) · `rounded-card`(12) · `rounded-sheet`(22)

## import

- 정렬(외부 → `@/` → 상대경로), 타입 전용 `type` 표기, 중복 import 는 `--fix` 가 고친다
- 순환 import 금지(`import/no-cycle`). 배럴끼리 다시 내보내다 생기기 쉽다

## 지원 브라우저

`package.json` 의 `browserslist` — **Chrome · Edge 111+, Safari · iOS 16.4+, Firefox 128+.** Tailwind v4 의 바닥선과 같다
(`@property` · `color-mix()` 를 써서 이보다 낮으면 화면이 이미 깨진다). Next 는 이 범위로 JS 를 변환한다.

- 범위 안인지는 MDN 의 「Browser compatibility」 표에서 위 버전과 비교해 확인한다
- 범위에 없는 API 는 **기능 감지 후 대체 경로**로 쓴다. 모듈 최상위에서 만들지 않는다 — 없는 브라우저에서 그 파일을 쓰는 화면 전체가 깨진다
- 범위를 바꾸면 `docs/engineering/library-policy.md` 결정 기록에 남긴다

## 기기별 저장값(localStorage)

기기마다 기억하고 **일행과 나누지 않는 값**만 둔다(보기 설정 · 최근 고른 것 · 안내를 봤는지). 일행이 함께 봐야 하는 값은 DB 에 둔다.

- 키는 `tm-` 로 시작한다. 지금 쓰는 키: `tm-recent-emoji` · `tm-pc-day-view` · `tm-pc-day-view-tip` · `tm-exp-cur-mode`(PC 가계부 「결제 통화 / 원화 환산」). 새 키를 만들면 여기에 더한다
- **읽기 · 쓰기를 `try/catch` 로 감싼다.** 사생활 모드 · 막힌 저장소에서는 접근만으로 예외가 난다. 실패하면 기본값으로 그리고, 바꾼 값은 그 화면에서만 기억한다
- 첫 렌더에서 읽으면 하이드레이션과 어긋난다. 클라이언트에서만 마운트되는 컴포넌트(예: 화면 폭을 안 뒤에 그리는 PC 레이아웃)에서 읽거나 마운트 뒤에 읽는다

## 토스트는 화면에 하나

`Toast` 는 body 의 같은 자리에 그려서, **두 곳에서 그리면 겹친다.** 「새 토스트가 이전 것을 대체한다」 는 한 인스턴스 안에서만 맞다.
화면(view)이 하나를 그리고 상태를 쥔다. 하위 컴포넌트 · 훅은 `<Toast>` 를 직접 그리지 않고 콜백(`onToast(text)` · `onGuide(text, detail)`)으로 요청한다.
예: `views/trip-schedule` 의 `useDetailOverlays().showToast`.

## 요청을 prop 으로 내릴 때

「그 날로 스크롤해 줘」 처럼 **한 번 실행할 요청**을 상태로 만들어 prop 으로 내리면, 받는 컴포넌트가 다시 마운트될 때 지난 요청이 다시 실행된다.
모바일 · PC 레이아웃은 화면 폭에 따라 하나만 마운트하므로(지도가 두 개 생기지 않게) 폭이 1024 를 넘나들 때의 재마운트가 정상 경로다.

- 요청은 매번 새 객체로 만든다(`{ day, at: Date.now() }`) — 같은 값을 다시 요청해도 실행되게
- 받는 쪽은 **마운트할 때 이미 있던 요청을 처리한 것으로 본다.** 예: `views/trip-schedule/model/use-day-jumps.ts`
- 받는 훅을 끌 때는 꺼진 동안 온 요청을 버릴지 · 나중에 실행할지 정해서 주석에 적는다

## 왜 airbnb 규칙을 안 쓰나

`eslint-config-airbnb` 는 ESLint 8 까지만 지원한다(이 레포는 9 · flat config). 커뮤니티 포크가 있지만 규칙 다수가
`eslint-config-next`·typescript-eslint·Prettier 와 겹치거나 부딪친다. 필요한 규칙을 골라 켜는 쪽을 택했다.

## 커밋 전 검사와 CI

- **pre-commit**: `husky` → `lint-staged` 가 **스테이징된 파일에만** `eslint --fix` → `prettier --write`.
  린트 오류가 남으면 커밋이 막힌다. 느린 `import/no-cycle` 은 여기서 끈다(모듈 그래프 전체를 본다)
- **pre-push**: `pnpm check` — CI 와 같은 순서로 `typecheck` · `lint` · `lint:changed` · `test` · `format:check` · `build` (약 1분).
  git 에는 PR 직전 훅이 없어서, PR 을 올리려면 반드시 거치는 푸시에 건다. 급할 때만 `--no-verify`, CI 가 다시 검사한다.
  검사는 디스크의 파일을 읽으므로 **커밋하지 않은 변경이 있거나 HEAD 가 아닌 브랜치를 푸시하면 멈춘다**(커밋 · stash 후 다시)
- **`lint:changed`**: main 이후 **바뀐 파일만 경고 0** 으로 린트한다. 전체 린트는 경고를 허용하므로, 손댄 파일의 긴 파일 · 복잡도 경고는
  그 PR 에서 정리한다. 손대지 않은 파일의 오래된 경고로는 실패하지 않는다
- **CI** (`.github/workflows/ci.yml`): PR 과 main 에서 `pnpm typecheck`(`next typegen` 으로 라우트 타입을 만든 뒤 `tsc`) · `pnpm lint`(순환 포함) ·
  `lint:changed`(PR 만) · `pnpm test` · `format:check` · `build`. 비밀값 없이 돈다. 실패하면 머지하지 않는다

## 브라우저로 확인할 때

화면 동작은 PR 을 올리기 전에 브라우저에서 확인한다(PC + 모바일 390px). 자동화로 여는 탭은 **백그라운드라 그리기 단계가 돌지 않아** 아래는 확인되지 않는다.
확인하지 못한 것은 PR 본문에 「직접 확인 필요」 로 적는다. 확인했다고 쓰지 않는다.

- 부드러운 스크롤(`behavior: "smooth"`) · `requestAnimationFrame` · `ResizeObserver` · 닫히는 애니메이션 — 위치만 볼 때는 `scrollTo` 를 `instant` 로 바꿔 확인한다
- 지도 타일 · 핀, 바깥 누르기 · blur · 끌기
- **Chrome 은 스크롤 앵커링이 기본이라** 위쪽 내용이 길어져도 보던 자리를 지킨다. Safari 처럼 앵커링이 없는 브라우저의 동작을 재현하려면 스크롤 칸에 `overflow-anchor: none` 을 건다
- 확인하느라 바꾼 것(DB 의 테스트 데이터 · localStorage 값)은 원래대로 돌려 놓는다. 테스트 데이터는 **만들 때 받은 id 를 적어 두고 그 id 로만 지운다** — 이름 패턴(`like '테스트*'`)으로 지우면 같은 여행에서 사람이 직접 만든 데이터까지 지운다

# 의존성

새 의존성 추가 · 자체 구현과 라이브러리 사이의 교체 · 메이저 업그레이드 · 제거는 **코드를 쓰기 전에**
[`docs/engineering/library-policy.md`](docs/engineering/library-policy.md) 절차를 따르고 결과를 그 문서의 결정 기록 로그에 남긴다.
사용자 승인 전에는 `pnpm add` 하지 않는다.

# 인증 경계

로그인은 Google OAuth 와 **익명(둘러보기)** 두 가지다. 둘러보기는 샘플 여행이 담긴
일회용 계정으로 들어가는 기능이다.

## is_anonymous 함정

**Supabase 익명 사용자도 `authenticated` role 을 받는다.** 구분은 JWT 의 `is_anonymous`
claim 하나뿐이다. 그래서 다음 검사들은 **익명을 전부 통과시킨다.**

```
auth.uid() is not null        -- 통과
to authenticated              -- 통과
if (!user) ...                -- 통과
```

익명 로그인을 켠 순간 기존 정책의 의미가 조용히 넓어졌다. **권한을 다루는 코드를 쓸 때마다
「익명이 여기 들어와도 되는가」를 따로 묻는다.**

판단 기준은 **남의 데이터에 흔적을 남기는가**다. 익명 계정은 복구 수단이 없어서 쿠키가
지워지면 사라진다. 자기 데이터만 망가지는 건 둘러보기의 의도지만, 남의 여행에 멤버로
들어가는 것 같은 동작은 막아야 한다. 주인 쪽에 정체 모를 멤버가 남는다.

## DB 함수 테스트

마이그레이션은 `supabase/db.test.ts` 가 **PGlite(WASM Postgres)** 에 순서대로 적용해 확인한다.
DB 함수나 RLS 를 바꾸면 여기에 동작을 고정한다(정상 · 거부 · 롤백). Supabase 의 `auth.uid()` ·
역할 · storage 는 최소 대역이고, PostgREST 와 동시성은 확인하지 못한다.

## security definer 함수

`security definer` 는 호출자 권한을 무시하므로 **RLS 가 걸리지 않는다.** 함수 안의 검사가
유일한 경계다. 새로 만들 때마다 익명 허용 여부를 정해 `supabase/migrations.test.ts` 의 `ANONYMOUS_ALLOWED` 와
[`docs/policies/data-model.md`](docs/policies/data-model.md) 「DB 함수」 표에 함께 적는다.

## 데이터 · 권한 정책 문서

테이블마다 누가 읽고 고치는지, 지켜야 하는 규칙과 그것을 지키는 곳, 동작별로 바뀌는 데이터는
[`docs/policies/data-model.md`](docs/policies/data-model.md) 에 있다. 권한을 다루는 기능을 만들거나 리뷰할 때 먼저 읽는다.
장소 검색 범위 · 구글 지도 · 장소 API 결정은 [`docs/policies/place-search.md`](docs/policies/place-search.md) 에 쌓는다.
일정 화면의 동작 규칙(이어서 · 하루씩 보기 · 편집 · 상세 · 시간 입력)은 [`docs/policies/schedule.md`](docs/policies/schedule.md) 에 있다. 일정 화면의 동작을 바꾸면 같은 PR 에서 그 문서도 고친다.
**마이그레이션(테이블 · 정책 · 함수 · 트리거)을 바꾸면 같은 PR 에서 이 문서도 고친다.** 테이블 · 함수 이름이 빠지면 `migrations.test.ts` 가 막는다.

## 클라이언트 가드는 가드가 아니다

`useUser()` 는 비동기라 **응답 전까지 `undefined`** 다. 그동안 기본 분기가 그려지고 눌린다.
되돌릴 수 없는 동작(합류 · 결제 · 삭제)을 클라이언트 훅 결과로 막으면 안 된다.

서버 컴포넌트에서 판정해 prop 으로 내리면 레이스는 닫히지만 **API 는 여전히 열려 있다.**
동작을 막는 건 DB 쪽에서 한다. UI 를 숨기는 것과 동작을 막는 것은 다른 층이다.

# 할 일 트래커

작업 목록은 **GitHub 이슈**에 있다. 다른 곳에 따로 두지 않는다.

```
gh issue list --milestone "디자인 핸드오프 구현"   # 디자인 구현 로드맵 (a)~(j)
gh issue list --label tech-debt                    # 미룬 기술 부채
```

- **다음에 뭘 할지 모르겠으면 먼저 이슈를 읽는다.** 로드맵 이슈는 핸드오프의 단계
  하나에 대응하고, 본문 체크리스트가 그 단계의 세부 항목이다.
- 작업을 끝내면 PR 본문에 `Closes #N` 을 적는다. 단계의 일부만 했으면 이슈 본문의
  체크박스만 체크하고 이슈는 열어 둔다.
- **범위를 좁힐 때마다 이슈를 만든다.** 발견했지만 이번에 안 고치는 것은 메시지로만
  알리지 말고 `gh issue create` 로 남긴다. 라벨은 `tech-debt` 또는 `structure`,
  본문에 파일 경로와 발견 맥락을 적는다.
