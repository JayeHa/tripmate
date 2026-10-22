import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

/**
 * 미리 저장할 오프라인 대체 페이지(`/~offline`)의 버전 — 배포마다 바뀌어 새 버전을 받게.
 * Vercel 은 커밋 값을 환경 변수로 주고, 로컬은 git 에서 읽는다. 둘 다 없으면 빌드마다 새 값
 */
const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

/**
 * 서비스 워커 파일(`/serwist/sw.js`)을 빌드 때 만들어 내준다 — `app/sw.ts` 에 빌드 파일 목록(미리 저장)을 넣는다.
 * @see https://serwist.pages.dev/docs/next/turbo
 */
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute(
  {
    additionalPrecacheEntries: [{ url: "/~offline", revision }],
    // 빌드 결과(JS · CSS)와 아이콘만 미리 저장한다. public 의 pdf.js(5MB, 바우처를 올릴 때만 · 온라인)와 도시 사진 원본(next/image 가 따로 받는다)은 뺀다
    globPatterns: [".next/static/**/*.{js,css,ico,png,svg,webp,woff2}", "public/icons/**/*"],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  },
);
