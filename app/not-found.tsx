import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Page non trouvée
        </h2>
        <p className="text-gray-400 mb-8">
          La page que vous recherchez n'existe pas.
        </p>
        
        {/* Message de diagnostic */}
        <div className="bg-red-600 text-white p-4 rounded-lg mb-4 max-w-md mx-auto">
          <p className="font-bold text-lg">🔍 DIAGNOSTIC : Page not-found.tsx chargée</p>
          <p className="text-sm mt-2">
            Si vous voyez ce message, c'est que Next.js a affiché la page not-found.tsx
          </p>
          <p className="text-xs mt-1 opacity-75">
            Timestamp: {new Date().toLocaleString('fr-FR')}
          </p>
        </div>
        
        <Link
          href="/platform/dashboard"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}

