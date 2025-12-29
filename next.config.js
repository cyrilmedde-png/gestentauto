/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'www.talosprimes.com',
      },
      {
        protocol: 'https',
        hostname: 'talosprimes.com',
      },
    ],
    unoptimized: false,
  },
}

module.exports = nextConfig
