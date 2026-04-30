import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 让 pdfjs-dist 在 Node.js 运行时原样加载，不经过 Turbopack 打包
  serverExternalPackages: ["pdfjs-dist"],
  turbopack: {},
};

export default nextConfig;
