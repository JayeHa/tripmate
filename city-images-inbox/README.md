# 도시 사진 inbox

도시 대표 사진 원본을 여기에 넣는다. 이 파일 말고는 커밋되지 않는다.

1. 원본을 **도시 이름이나 id** 로 넣는다: `도쿄.jpg`, `오사카.png`, `chiang-mai.jpg`
   - 크기·형식은 상관없다(jpg · png · webp · avif · tiff). 아이폰 HEIC 는 jpg 로 내보내서 넣는다
   - 도시 이름·id 목록: `supabase/migrations/0006_cities.sql`
2. 레포 루트에서 실행한다.
   ```bash
   pnpm cities:images
   ```
3. 바뀐 `public/city-images/` 와 `src/shared/config/city-images.ts` 를 커밋한다. DB 작업은 없다.

- 처리한 원본은 `done/` 으로 옮겨진다. 이름을 못 알아본 파일은 여기 남고, 이유가 터미널에 나온다
- 같은 도시 사진을 다시 넣으면 교체된다. 사진을 빼는 법 등 자세한 내용은 루트 [README](../README.md) 「도시 대표 사진 추가」
