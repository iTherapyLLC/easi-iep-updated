/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Explicitly use empty turbopack config to silence the webpack warning
  // but force webpack mode via package.json build script
  turbopack: {},
}

export default nextConfig
