import type { NextConfig } from "next";
import { queryCacheHash } from "./query-cache.config.mjs";

const nextConfig: NextConfig = {
  env: {
    // 저장된 쿼리 캐시의 데이터 모양 버전. providers.tsx 가 persist buster 로 쓴다.
    QUERY_CACHE_HASH: queryCacheHash(),
  },
  images: {
    // 도시 사진만 최적화한다. 경로가 사진 목록(shared/config/city-images.ts)에서 온다.
    localPatterns: [{ pathname: "/city-images/**", search: "" }],
  },
};

export default nextConfig;
