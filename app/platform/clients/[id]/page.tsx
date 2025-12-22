'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { useAuth } from '@/components/auth/AuthProvider'
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle, Edit, Save, X, Users, UserPlus, Key, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

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

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  company_id: string
  role_id: string | null
  created_at: string
  roles: {
    id: string
    name: string
  } | null
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
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const clientId = params.id as string
  
  const [activeTab, setActiveTab] = useState<'details' | 'users'>('details')
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
      const editParam = searchParams.get('edit')
      if (editParam === 'true') {
        setIsEditing(true)
      }
    }
  }, [clientId, searchParams])

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

      {/* Onglets */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-border/50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 font-medium transition-colors whitespace-nowrap min-h-[44px] touch-manipulation ${
            activeTab === 'details'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground active:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Détails</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 font-medium transition-colors whitespace-nowrap min-h-[44px] touch-manipulation ${
            activeTab === 'users'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground active:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Utilisateurs</span>
          </div>
        </button>
      </div>

      {/* Contenu selon l'onglet */}
      {activeTab === 'details' && (
        <>
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
        </>
      )}

      {activeTab === 'users' && client && (
        <ClientUsersTab companyId={client.id} currentUserId={user?.id} />
      )}
    </div>
  )
}

// Composant pour l'onglet Utilisateurs
function ClientUsersTab({ 
  companyId, 
  currentUserId 
}: { 
  companyId: string
  currentUserId?: string 
}) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resettingPassword, setResettingPassword] = useState<string | null>(null)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [companyId])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {}
      if (currentUserId) {
        headers['X-User-Id'] = currentUserId
      }

      const response = await fetch(`/api/platform/users?company_id=${companyId}`, {
        credentials: 'include',
        headers,
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    try {
      setDeletingUser(userId)
      setError(null)
      setSuccess(null)

      const headers: HeadersInit = {}
      if (currentUserId) {
        headers['X-User-Id'] = currentUserId
      }

      const response = await fetch(`/api/platform/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      setSuccess('Utilisateur supprimé avec succès')
      setTimeout(() => setSuccess(null), 3000)
      loadUsers()
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setDeletingUser(null)
    }
  }

  const handleResetPassword = async (userId: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    try {
      setError(null)
      setSuccess(null)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (currentUserId) {
        headers['X-User-Id'] = currentUserId
      }

      const response = await fetch(`/api/platform/users/${userId}/reset-password`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ new_password: newPassword }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la réinitialisation')
      }

      setSuccess('Mot de passe réinitialisé avec succès')
      setTimeout(() => setSuccess(null), 3000)
      setResettingPassword(null)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Chargement des utilisateurs...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Header avec bouton créer */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">
          Utilisateurs de l'entreprise
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nouvel utilisateur</span>
        </button>
      </div>

      {/* Liste des utilisateurs */}
      {users.length === 0 ? (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-8 sm:p-12 text-center">
          <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Aucun utilisateur pour cette entreprise
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Créer le premier utilisateur
          </button>
        </div>
      ) : (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-background/30">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Nom
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Rôle
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Date de création
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem) => (
                <tr 
                  key={userItem.id} 
                  className="border-b border-border/30 hover:bg-background/30 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-foreground">
                    {userItem.first_name || userItem.last_name
                      ? `${userItem.first_name || ''} ${userItem.last_name || ''}`.trim()
                      : '-'
                    }
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {userItem.email}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {userItem.roles?.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(userItem.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(userItem)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setResettingPassword(userItem.id)}
                        className="p-1.5 text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
                        title="Réinitialiser le mot de passe"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(userItem.id)}
                        disabled={deletingUser === userItem.id}
                        className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          companyId={companyId}
          onClose={() => {
            setShowCreateModal(false)
            setEditingUser(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingUser(null)
            loadUsers()
          }}
          currentUserId={currentUserId}
        />
      )}

      {resettingPassword && (
        <ResetPasswordModal
          userId={resettingPassword}
          onClose={() => setResettingPassword(null)}
          onSuccess={(newPassword) => {
            handleResetPassword(resettingPassword, newPassword)
          }}
        />
      )}
    </div>
  )
}

// Modal création/édition utilisateur
function UserModal({
  user,
  companyId,
  onClose,
  onSuccess,
  currentUserId,
}: {
  user: User | null
  companyId: string
  onClose: () => void
  onSuccess: () => void
  currentUserId?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError('Email est obligatoire')
      return
    }

    if (!user && !password) {
      setError('Le mot de passe est obligatoire pour la création')
      return
    }

    if (password && password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (currentUserId) {
        headers['X-User-Id'] = currentUserId
      }

      if (user) {
        // Édition
        const response = await fetch(`/api/platform/users/${user.id}`, {
          method: 'PATCH',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            first_name: firstName || null,
            last_name: lastName || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erreur lors de la modification')
        }

        onSuccess()
      } else {
        // Création
        const response = await fetch('/api/platform/users', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            company_id: companyId,
            email,
            password,
            first_name: firstName || null,
            last_name: lastName || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erreur lors de la création')
        }

        onSuccess()
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!user}
            className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            placeholder="user@example.com"
          />
        </div>

        {!user && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Mot de passe <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Minimum 8 caractères"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Prénom
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Jean"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nom
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Dupont"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-background border border-border/50 text-foreground rounded-lg hover:bg-background/70 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Enregistrement...' : user ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Modal réinitialisation mot de passe
function ResetPasswordModal({
  userId,
  onClose,
  onSuccess,
}: {
  userId: string
  onClose: () => void
  onSuccess: (newPassword: string) => void
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password || password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    onSuccess(password)
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Réinitialiser le mot de passe"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nouveau mot de passe <span className="text-red-400">*</span>
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Minimum 8 caractères"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Confirmer le mot de passe <span className="text-red-400">*</span>
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Répétez le mot de passe"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-background border border-border/50 text-foreground rounded-lg hover:bg-background/70 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Key className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>
      </form>
    </Modal>
  )
}

