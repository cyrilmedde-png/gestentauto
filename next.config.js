/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Désactivé pour éviter les doubles renders qui causent des bugs avec les animations
  images: {
    domains: ['localhost'],
  },
  // Désactiver le cache des pages en développement pour éviter les problèmes
  onDemandEntries: {
    // Durée maximale en ms pendant laquelle une page inactive sera conservée en mémoire
    maxInactiveAge: 25 * 1000,
    // Nombre de pages qui doivent être conservées simultanément sans être supprimées
    pagesBufferLength: 2,
  },
  // Configuration webpack
  webpack: (config, { dev, isServer }) => {
    // Supprimer tous les warnings webpack
    config.ignoreWarnings = [
      { module: /node_modules/ },
      { file: /node_modules/ },
      /Failed to parse source map/,
      /Caching failed for pack/,
      /Unable to snapshot resolve dependencies/,
    ]
    
    // Désactiver le cache pour supprimer les warnings de cache
    if (!dev) {
      config.cache = false
    }
    
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

module.exports = nextConfig
