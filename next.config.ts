import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 이미지 경로가 DB(cities.image_path)에서 온다. 최적화 대상을 도시 사진 폴더로만 좁힌다.
    localPatterns: [{ pathname: "/city-images/**", search: "" }],
  },
};

export default nextConfig;
