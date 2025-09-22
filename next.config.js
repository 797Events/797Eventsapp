/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.797events.com',
          },
        ],
        destination: 'https://797events.com/:path*',
        permanent: true,
      },
      // Ensure all URLs end with trailing slash to match Razorpay whitelist
      {
        source: '/:path((?!.*\\.).*[^/])',
        destination: '/:path*/',
        permanent: true,
      },
    ]
  },
  poweredByHeader: false,
  compress: true,
  trailingSlash: true,
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig