'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/components/auth/AuthProvider'
import { Building2, Users, Save, Edit, Mail, Phone, MapPin, FileText, Globe } from 'lucide-react'

interface CompanyConfig {
  id?: string
  name: string
  siret?: string
  vat_number?: string
  address?: string
  city?: string
  postal_code?: string
  country: string
  phone?: string
  email?: string
}

interface Client {
  id: string
  name: string
  email?: string
  created_at: string
  subscription_status?: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [isPlatform, setIsPlatform] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      checkUserType()
    }
  }, [user])

  const checkUserType = async () => {
    try {
      setLoading(true)
      const headers: HeadersInit = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch('/api/auth/check-user-type', {
        method: 'GET',
        headers,
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setIsPlatform(data.isPlatform || false)
      } else {
        setIsPlatform(false)
      }
    } catch (error) {
      console.error('Error checking user type:', error)
      setIsPlatform(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading || isPlatform === null) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Paramètres
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {isPlatform 
                ? 'Configuration de la plateforme et gestion des clients'
                : 'Configuration de votre entreprise'
              }
            </p>
          </div>

          {isPlatform ? (
            <PlatformSettings />
          ) : (
            <CompanySettings companyId={user?.company_id} user={user} />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

// Composant pour les paramètres plateforme
function PlatformSettings() {
  const [activeTab, setActiveTab] = useState<'platform' | 'clients'>('platform')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [platformConfig, setPlatformConfig] = useState<CompanyConfig>({
    name: '',
    country: 'FR'
  })
  const [clients, setClients] = useState<Client[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadPlatformConfig()
    loadClients()
  }, [])

  const loadPlatformConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/platform', {
        credentials: 'include',
      })
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Accès refusé. Utilisateur plateforme requis.')
        }
        throw new Error('Erreur lors du chargement')
      }
      
      const data = await response.json()
      if (data.platform) {
        setPlatformConfig(data.platform)
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const response = await fetch('/api/settings/clients', {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Erreur lors du chargement')
      
      const data = await response.json()
      setClients(data.clients || [])
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/settings/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(platformConfig)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      setSuccess('Configuration de la plateforme sauvegardée avec succès')
      setIsEditing(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Onglets */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-border/50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('platform')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 font-medium transition-colors whitespace-nowrap min-h-[44px] touch-manipulation ${
            activeTab === 'platform'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground active:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Plateforme</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 font-medium transition-colors whitespace-nowrap min-h-[44px] touch-manipulation ${
            activeTab === 'clients'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground active:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Clients</span>
          </div>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Contenu */}
      {activeTab === 'platform' && (
        <>
          {isEditing ? (
            <CompanyConfigForm
              config={platformConfig}
              setConfig={setPlatformConfig}
              onSave={handleSavePlatform}
              onCancel={() => {
                setIsEditing(false)
                loadPlatformConfig()
              }}
              loading={loading}
              saving={saving}
              title="Informations de la plateforme"
              description="Configuration de la plateforme système"
            />
          ) : (
            <CompanyConfigCard
              config={platformConfig}
              onEdit={() => setIsEditing(true)}
              loading={loading}
              title="Informations de la plateforme"
              description="Configuration de la plateforme système"
            />
          )}
        </>
      )}

      {activeTab === 'clients' && (
        <ClientsList clients={clients} onRefresh={loadClients} />
      )}
    </>
  )
}

// Composant pour les paramètres de l'entreprise (clients)
function CompanySettings({ companyId, user }: { companyId?: string; user?: { id: string } | null }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>({
    name: '',
    country: 'FR'
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    // Attendre que user soit chargé avant de charger les données
    if (user?.id) {
      loadCompanyConfig()
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCompanyConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Vérifier que user est disponible
      if (!user?.id) {
        throw new Error('Utilisateur non connecté')
      }
      
      // Préparer les headers avec l'ID utilisateur
      const headers: HeadersInit = {
        'X-User-Id': user.id, // Toujours envoyer l'ID utilisateur
      }
      
      const response = await fetch('/api/settings/company', {
        method: 'GET',
        credentials: 'include', // Important : envoyer les cookies de session
        headers,
      })
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Accès refusé. Cette route est réservée aux clients.')
        }
        throw new Error('Erreur lors du chargement')
      }
      
      const data = await response.json()
      if (data.company) {
        setCompanyConfig(data.company)
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Préparer les headers avec l'ID utilisateur
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }
      
      const response = await fetch('/api/settings/company', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(companyConfig)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      setSuccess('Configuration de votre entreprise sauvegardée avec succès')
      setIsEditing(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Contenu */}
      {isEditing ? (
        <CompanyConfigForm
          config={companyConfig}
          setConfig={setCompanyConfig}
          onSave={handleSaveCompany}
          onCancel={() => {
            setIsEditing(false)
            loadCompanyConfig()
          }}
          loading={loading}
          saving={saving}
          title="Informations de votre entreprise"
          description="Configurez les informations de votre entreprise"
        />
      ) : (
        <CompanyConfigCard
          config={companyConfig}
          onEdit={() => setIsEditing(true)}
          loading={loading}
          title="Informations de votre entreprise"
          description="Informations de votre entreprise"
        />
      )}
    </>
  )
}

// Composant carte de configuration (mode lecture) - réutilisable
function CompanyConfigCard({
  config,
  onEdit,
  loading,
  title,
  description
}: {
  config: CompanyConfig
  onEdit: () => void
  loading: boolean
  title: string
  description: string
}) {
  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Chargement...
      </div>
    )
  }

  if (!config.name) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Aucune configuration</p>
          <button
            onClick={onEdit}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Configurer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground hover:bg-background/70 transition-colors"
        >
          <Edit className="w-4 h-4" />
          <span>Modifier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium text-muted-foreground">Nom</label>
          </div>
          <p className="text-foreground font-medium">{config.name}</p>
        </div>

        {/* Email */}
        {config.email && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">Email</label>
            </div>
            <p className="text-foreground">{config.email}</p>
          </div>
        )}

        {/* Téléphone */}
        {config.phone && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
            </div>
            <p className="text-foreground">{config.phone}</p>
          </div>
        )}

        {/* Adresse */}
        {(config.address || config.city || config.postal_code) && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">Adresse</label>
            </div>
            <p className="text-foreground">
              {[config.address, config.postal_code, config.city].filter(Boolean).join(', ')}
            </p>
          </div>
        )}

        {/* Pays */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium text-muted-foreground">Pays</label>
          </div>
          <p className="text-foreground">{config.country}</p>
        </div>

        {/* SIRET */}
        {config.siret && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">SIRET</label>
            </div>
            <p className="text-foreground">{config.siret}</p>
          </div>
        )}

        {/* Numéro de TVA */}
        {config.vat_number && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">Numéro de TVA</label>
            </div>
            <p className="text-foreground">{config.vat_number}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Composant formulaire de configuration - réutilisable
function CompanyConfigForm({
  config,
  setConfig,
  onSave,
  onCancel,
  loading,
  saving,
  title,
  description
}: {
  config: CompanyConfig
  setConfig: (config: CompanyConfig) => void
  onSave: (e: React.FormEvent) => void
  onCancel: () => void
  loading: boolean
  saving: boolean
  title: string
  description: string
}) {
  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Chargement...
      </div>
    )
  }

  return (
    <form onSubmit={onSave} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nom <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Nom de l'entreprise"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={config.email || ''}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="contact@entreprise.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              SIRET
            </label>
            <input
              type="text"
              value={config.siret || ''}
              onChange={(e) => setConfig({ ...config, siret: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="12345678901234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Numéro de TVA
            </label>
            <input
              type="text"
              value={config.vat_number || ''}
              onChange={(e) => setConfig({ ...config, vat_number: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="FR12345678901"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={config.address || ''}
              onChange={(e) => setConfig({ ...config, address: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="123 Rue Example"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Code postal
              </label>
              <input
                type="text"
                value={config.postal_code || ''}
                onChange={(e) => setConfig({ ...config, postal_code: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="75001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Ville
              </label>
              <input
                type="text"
                value={config.city || ''}
                onChange={(e) => setConfig({ ...config, city: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Paris"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Pays
            </label>
            <select
              value={config.country}
              onChange={(e) => setConfig({ ...config, country: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="FR">France</option>
              <option value="BE">Belgique</option>
              <option value="CH">Suisse</option>
              <option value="CA">Canada</option>
              <option value="US">États-Unis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={config.phone || ''}
              onChange={(e) => setConfig({ ...config, phone: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="+33 1 23 45 67 89"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-6 py-2 bg-background border border-border/50 text-foreground rounded-lg hover:bg-background/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </form>
  )
}

// Composant liste des clients (pour plateforme uniquement)
function ClientsList({
  clients,
  onRefresh
}: {
  clients: Client[]
  onRefresh: () => void
}) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Clients abonnés
        </h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm bg-background border border-border/50 rounded-lg text-foreground hover:bg-background/70 transition-colors"
        >
          Actualiser
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm sm:text-base">Aucun client abonné pour le moment</p>
        </div>
      ) : (
        <>
          {/* Version Desktop (tableau) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Nom
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Date d'inscription
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-border/30 hover:bg-background/30">
                    <td className="py-3 px-4 text-sm text-foreground">
                      {client.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {client.email || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        client.subscription_status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {client.subscription_status || 'Non défini'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(client.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Version Mobile (cartes) */}
          <div className="md:hidden space-y-3">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-background/30 border border-border/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm sm:text-base truncate">
                      {client.name}
                    </div>
                    {client.email && (
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                        {client.email}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ml-2 ${
                    client.subscription_status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {client.subscription_status || 'Non défini'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Inscrit le {new Date(client.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
