'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { useAuth } from '@/components/auth/AuthProvider'
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle, Edit, Save, X } from 'lucide-react'

interface ClientDetails {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  siret?: string
  vat_number?: string
  created_at: string
  subscription_status?: string
}

export default function ClientDetailsPage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <ClientDetailsContent />
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

function ClientDetailsContent() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const clientId = params.id as string
  
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (clientId) {
      loadClientDetails()
      // Vérifier si on doit ouvrir en mode édition depuis l'URL
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const editParam = urlParams.get('edit')
        if (editParam === 'true') {
          setIsEditing(true)
        }
      }
    }
  }, [clientId])

  const loadClientDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch(`/api/platform/companies/${clientId}`, {
        credentials: 'include',
        headers,
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des détails')
      }

      const data = await response.json()
      setClient(data.company)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!client) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch(`/api/platform/companies/${clientId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          city: client.city,
          postal_code: client.postal_code,
          country: client.country,
          siret: client.siret,
          vat_number: client.vat_number,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      setSuccess('Modifications enregistrées avec succès')
      setIsEditing(false)
      setTimeout(() => setSuccess(null), 3000)
      loadClientDetails()
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="text-center py-12 text-muted-foreground">
          Chargement des détails...
        </div>
      </div>
    )
  }

  if (error && !client) {
    return (
      <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error || 'Client non trouvé'}
        </div>
        <button
          onClick={() => router.push('/platform/clients')}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Retour à la liste
        </button>
      </div>
    )
  }

  if (!client) {
    return null
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => router.push('/platform/clients')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste</span>
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              {client.name}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Détails du client
            </p>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Edit className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false)
                  loadClientDetails()
                }}
                className="flex items-center gap-2 px-4 py-2 bg-background border border-border/50 text-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <X className="w-4 h-4" />
                <span>Annuler</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Sauvegarde...' : 'Enregistrer'}</span>
              </button>
            </div>
          )}
        </div>
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

      {/* Détails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Informations générales
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Nom de l'entreprise
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ) : (
                <p className="text-foreground">{client.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={client.email || ''}
                  onChange={(e) => setClient({ ...client, email: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ) : (
                <p className="text-foreground">{client.email || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Téléphone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={client.phone || ''}
                  onChange={(e) => setClient({ ...client, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ) : (
                <p className="text-foreground">{client.phone || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Adresse
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={client.address || ''}
                    onChange={(e) => setClient({ ...client, address: e.target.value })}
                    placeholder="Rue et numéro"
                    className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={client.postal_code || ''}
                      onChange={(e) => setClient({ ...client, postal_code: e.target.value })}
                      placeholder="Code postal"
                      className="px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="text"
                      value={client.city || ''}
                      onChange={(e) => setClient({ ...client, city: e.target.value })}
                      placeholder="Ville"
                      className="px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-foreground">
                  {client.address 
                    ? `${client.address}${client.postal_code ? ', ' + client.postal_code : ''}${client.city ? ' ' + client.city : ''}`
                    : '-'
                  }
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Pays
              </label>
              {isEditing ? (
                <select
                  value={client.country || 'FR'}
                  onChange={(e) => setClient({ ...client, country: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="FR">France</option>
                  <option value="BE">Belgique</option>
                  <option value="CH">Suisse</option>
                  <option value="CA">Canada</option>
                  <option value="US">États-Unis</option>
                </select>
              ) : (
                <p className="text-foreground">{client.country || 'FR'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Statut et informations</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Date d'inscription
              </label>
              <p className="text-foreground">
                {new Date(client.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Statut d'abonnement
              </label>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                client.subscription_status === 'active'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {client.subscription_status === 'active' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {client.subscription_status || 'Non défini'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                SIRET
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={client.siret || ''}
                  onChange={(e) => setClient({ ...client, siret: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="12345678901234"
                />
              ) : (
                <p className="text-foreground">{client.siret || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Numéro de TVA
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={client.vat_number || ''}
                  onChange={(e) => setClient({ ...client, vat_number: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="FR12345678901"
                />
              ) : (
                <p className="text-foreground">{client.vat_number || '-'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

