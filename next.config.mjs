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
  // Explicitly disable Turbopack - use stable Webpack instead
  experimental: {
    // Do not use turbo/turbopack
  },
  // Ensure we're using webpack
  webpack: (config) => {
    return config
  },
}

export default nextConfig
