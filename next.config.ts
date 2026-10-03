import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: {
    // 도시 사진(Supabase Storage 공개 버킷)만 허용한다.
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl}/storage/v1/object/public/city-images/**`)]
      : [],
  },
};

export default nextConfig;
