// pnpm cities:images 가 public/city-images 를 보고 만든다. 손으로 고치지 않는다.
/** 도시 id → 대표 사진 경로. 없는 도시는 첫 글자 + 틴트로 대신한다. */
export const CITY_IMAGES: Readonly<Record<string, string>> = {
  tokyo: "/city-images/tokyo.c5988137.webp",
};
