/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Désactivé temporairement pour éviter les double-renders qui peuvent causer des rechargements
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
