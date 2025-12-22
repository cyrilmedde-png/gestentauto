/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'www.talosprimes.com', 'talosprimes.com'],
    unoptimized: false,
  },
}

module.exports = nextConfig
