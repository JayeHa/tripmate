# TripMate

트리플을 대신할 개인용 여행 앱. 일정(구글맵 경로) · 다중 화폐 가계부/정산 · 일행 공유.

- Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn · TanStack Query
- Supabase (Google 로그인 · 둘러보기, Postgres + RLS, Realtime)
- Google Maps (Places API New, Routes API)

## 문서

| 문서                                                     | 내용                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| [`docs/setup.md`](docs/setup.md)                         | 처음 설정 — Supabase · Google Cloud · 로컬 실행 · Vercel 배포 |
| [`AGENTS.md`](AGENTS.md)                                 | 코드 구조(FSD) · 인증 경계 · 할 일 트래커 규칙                |
| [GitHub 이슈](https://github.com/JayeHa/tripmate/issues) | 로드맵(마일스톤 「디자인 핸드오프 구현」) · 미룬 기술 부채    |

```bash
pnpm dev      # http://localhost:3000
pnpm test
```

## 자주 하는 작업

### 도시 대표 사진 추가

도시 목록·여행 썸네일에 보이는 사진이다. 사진이 없는 도시는 첫 글자 + 색 원으로 보인다.

1. 원본을 레포 루트의 **`city-images-inbox/`** 에 넣는다. 크기·형식은 상관없다(jpg · png · webp · avif · tiff).
   **파일 이름은 도시 이름이나 id** 로 짓는다: `도쿄.jpg`, `오사카.png`, `chiang-mai.jpg`
   - 도시 이름·id 목록: `supabase/migrations/0006_cities.sql`
   - 아이폰 HEIC 는 못 읽는다. 사진 앱에서 jpg 로 내보낸다
2. 실행한다.
   ```bash
   pnpm cities:images
   ```
   - 긴 변 800px webp 로 줄여 `public/city-images/{id}.{해시}.webp` 에 저장하고, 사진 목록 `src/shared/config/city-images.ts` 를 다시 쓴다
   - 원본은 `city-images-inbox/done/` 으로 옮겨진다(커밋되지 않음)
   - 이름을 못 알아본 파일은 inbox 에 남기고 이유를 알려 준다. 150KB 가 넘으면 경고한다
3. 바뀐 `public/city-images/` 와 `src/shared/config/city-images.ts` 를 커밋한다. **DB 작업은 없다.**

- **사진 바꾸기**: 같은 도시 이름으로 새 원본을 넣고 다시 실행하면 이전 사진을 지우고 바꾼다. 파일 이름의 해시가 바뀌어 캐시에 옛 사진이 남지 않는다.
- **사진 빼기**: `public/city-images/` 에서 그 도시 파일을 지우고 `pnpm cities:images` 를 실행한다(inbox 가 비어 있어도 목록을 다시 쓴다).
