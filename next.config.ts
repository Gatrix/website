import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.yandexcloud.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "polygon-ttrpg.storage.yandexcloud.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;