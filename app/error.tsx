'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-foreground">
          Une erreur s'est produite
        </h2>
        <p className="text-muted-foreground mb-6">
          {error.message || 'Une erreur inattendue est survenue'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4">
            Code d'erreur: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}




