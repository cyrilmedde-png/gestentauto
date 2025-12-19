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
  // Désactiver le cache webpack pour éviter les problèmes
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, // Vérifier les changements toutes les secondes
        aggregateTimeout: 300, // Attendre 300ms avant de recompiler
      }
    }
    return config
  },
}

module.exports = nextConfig

