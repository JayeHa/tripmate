# TripMate

트리플을 대신할 개인용 여행 앱. 일정(구글맵 경로) · 다중 화폐 가계부/정산 · 일행 공유.

- Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn · TanStack Query
- Supabase (Google 로그인, Postgres + RLS, Realtime)
- Google Maps (Places API New, Routes API)

## 1. Supabase 설정

1. https://supabase.com 에서 새 프로젝트 생성 (리전: Northeast Asia / Seoul 또는 Tokyo).
2. **SQL Editor** 에서 `supabase/migrations/0001_init.sql` → `0002_realtime.sql` → `0003_trips_select_owner.sql` → `0004_join_requires_real_account.sql` 순서로 실행.
   - 또는 CLI: `supabase login` → `supabase link --project-ref <ref>` → `supabase db push`
3. **Authentication → Providers → Google** 활성화 (아래 Google OAuth 클라이언트 ID/Secret 입력).
4. **Authentication → URL Configuration**
   - Site URL: 배포 URL (예: `https://tripmate.vercel.app`)
   - Redirect URLs: `http://localhost:3000/**`, `https://<app>.vercel.app/**`
5. **Project Settings → API** 의 URL과 anon key를 `.env.local` 에 입력.
6. 타입 재생성(선택): `pnpm db:types` (link 되어 있어야 함)

## 2. Google Cloud 설정

프로젝트 하나에서 아래를 모두 진행.

### OAuth (로그인)

- **APIs & Services → Credentials → Create OAuth client ID (Web application)**
  - Authorized JavaScript origins: `http://localhost:3000`, 배포 URL
  - Authorized redirect URIs: `https://canoqfjexkpbalosdauw.supabase.co/auth/v1/callback`
- 생성된 Client ID / Secret 을 Supabase Google Provider 에 입력.

### Maps

- **APIs & Services → Library** 에서 활성화:
  - Maps JavaScript API
  - Places API (New)
  - Routes API
- **Google Maps Platform → Map Management → Create Map ID** (Vector) → `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`
- **Credentials → API key** 2개 생성:
  - 브라우저 키 (`NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`)
    - Application restriction: HTTP referrers → `http://localhost:3000/*`, `https://*.vercel.app/*`, 배포 도메인
    - API restriction: Maps JavaScript API, Places API (New)
  - 서버 키 (`GOOGLE_MAPS_SERVER_KEY`)
    - Application restriction: None
    - API restriction: Routes API 만
- Billing 계정 연결 필요. 개인 사용량은 SKU별 월 무료 한도 안에 들어감 (예산 알림 $5 권장).

## 3. 로컬 실행

```bash
cp .env.local.example .env.local   # 값 채우기
pnpm install
pnpm dev                            # http://localhost:3000
pnpm test                           # 정산/날짜 단위 테스트
```

## 4. Vercel 배포

1. GitHub 에 push 후 Vercel 에서 import.
2. Environment Variables 에 `.env.local` 의 5개 값을 Production/Preview 모두 등록.
3. 배포 URL을 Supabase Redirect URLs, Google OAuth origins, 브라우저 키 referrer 에 추가.
4. 폰에서 열고 **홈 화면에 추가** 하면 앱처럼 사용 가능.

## 구조

```
app/                라우트 (login, join/[token], trips/[tripId]/{itinerary,map,expenses,settlement,settings}, api/routes)
components/         ui(shadcn), layout, trip, itinerary, map, expense
hooks/              TanStack Query 훅 (use-trip, use-schedule-items, use-expenses, use-day-route, use-realtime-trip)
lib/supabase/       client / server / proxy, database.types.ts
lib/queries/        Supabase 호출 함수
lib/settlement/     정산 로직 (순수 함수 + 테스트)
lib/maps/           Routes API 호출 (서버 전용)
supabase/migrations 스키마 + RLS + RPC
```
