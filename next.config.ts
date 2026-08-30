import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["playwright"],
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      { pathname: "/hotels/**" },
      { pathname: "/cities/**" },
      { pathname: "/logo.png" },
      { pathname: "/logo.jpg" },
    ],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
