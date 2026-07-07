/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 让 Next.js 支持 @ 别名(对应 tsconfig.json 的 paths)
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;