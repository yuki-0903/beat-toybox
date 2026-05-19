/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  output: process.env.NEXT_OUTPUT === "export" ? "export" : undefined,
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined
};

export default nextConfig;
