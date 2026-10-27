import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 서버 없이 정적 파일로 배포 (Vercel, Capacitor 공용). docs/decisions/003 참고
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
