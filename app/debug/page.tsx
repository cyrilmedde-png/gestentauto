'use client'

/**
 * Page de diagnostic pour vérifier la configuration
 */

export default function DebugPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return (
    <div className="min-h-screen bg-[#080808] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Diagnostic de Configuration</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Variables d'environnement</h2>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-400 mb-1">NEXT_PUBLIC_SUPABASE_URL</div>
                <div className={`p-3 rounded ${supabaseUrl ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                  {supabaseUrl ? (
                    <div>
                      <div className="text-green-400 mb-2">✅ Configuré</div>
                      <div className="text-xs text-gray-400 break-all">{supabaseUrl}</div>
                    </div>
                  ) : (
                    <div className="text-red-400">❌ Non configuré</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
                <div className={`p-3 rounded ${supabaseAnonKey ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                  {supabaseAnonKey ? (
                    <div>
                      <div className="text-green-400 mb-2">✅ Configuré</div>
                      <div className="text-xs text-gray-400 break-all">
                        {supabaseAnonKey.substring(0, 50)}...
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-400">❌ Non configuré</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">SUPABASE_SERVICE_ROLE_KEY</div>
                <div className={`p-3 rounded ${supabaseServiceRoleKey ? 'bg-green-900/30 border border-green-700' : 'bg-yellow-900/30 border border-yellow-700'}`}>
                  {supabaseServiceRoleKey ? (
                    <div>
                      <div className="text-green-400 mb-2">✅ Configuré</div>
                      <div className="text-xs text-gray-400 break-all">
                        {supabaseServiceRoleKey.substring(0, 50)}...
                      </div>
                    </div>
                  ) : (
                    <div className="text-yellow-400">⚠️ Optionnel (non configuré)</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Informations système</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Environnement:</span>{' '}
                <span className="text-white">{process.env.NODE_ENV || 'unknown'}</span>
              </div>
              <div>
                <span className="text-gray-400">Côté client:</span>{' '}
                <span className="text-white">{typeof window !== 'undefined' ? 'Oui' : 'Non'}</span>
              </div>
            </div>
          </div>

          {(!supabaseUrl || !supabaseAnonKey) && (
            <div className="bg-red-900/30 border border-red-700 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-red-400 mb-2">
                ⚠️ Configuration Incomplète
              </h3>
              <p className="text-gray-300 mb-4">
                Les variables d'environnement Supabase ne sont pas configurées correctement.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>1. Allez dans Vercel Dashboard → votre projet → Settings → Environment Variables</p>
                <p>2. Ajoutez les variables requises :</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                  <li>SUPABASE_SERVICE_ROLE_KEY (optionnel)</li>
                </ul>
                <p className="mt-4">3. Redéployez l'application</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

