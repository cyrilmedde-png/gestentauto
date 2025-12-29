'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { useAuth } from '@/components/auth/AuthProvider'
import { Users, Plus, Edit, Trash2, Key, Search, Filter, Mail, Building2, X, Save } from 'lucide-react'

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  company_id: string
  role_id: string | null
  created_at: string
  companies: {
    id: string
    name: string
  } | null
  roles: {
    id: string
    name: string
  } | null
}

interface Client {
  id: string
  name: string
}

export default function PlatformUsersPage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Gestion des Utilisateurs
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gérer les utilisateurs de tous les clients
            </p>
          </div>

          <UsersManagement />
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

function UsersManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resettingPassword, setResettingPassword] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
    loadClients()
  }, [filterClient])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const url = filterClient !== 'all' 
        ? `/api/platform/users?company_id=${filterClient}`
        : '/api/platform/users'

      const response = await fetch(url, {
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

  const loadClients = async () => {
    try {
      const headers: HeadersInit = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch('/api/settings/clients', {
        credentials: 'include',
        headers,
      })
      const data = await response.json()
      setClients(data.clients || [])
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    try {
      setError(null)
      const headers: HeadersInit = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
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
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleResetPassword = async (userId: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    try {
      setError(null)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (user?.id) {
        headers['X-User-Id'] = user.id
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
      setTimeout(() => setError(null), 5000)
    }
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.first_name && u.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.last_name && u.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.companies?.name && u.companies.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Chargement des utilisateurs...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">Tous les clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel utilisateur</span>
        </button>
      </div>

      {/* Liste des utilisateurs */}
      {filteredUsers.length === 0 ? (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-8 sm:p-12 text-center">
          <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">
            {searchTerm || filterClient !== 'all' 
              ? 'Aucun utilisateur ne correspond à votre recherche'
              : 'Aucun utilisateur pour le moment'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Version Desktop */}
          <div className="hidden md:block bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden">
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
                    Entreprise
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Rôle
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userItem) => (
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
                      {userItem.companies ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3" />
                          {userItem.companies.name}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {userItem.roles?.name || '-'}
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
                          className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
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

          {/* Version Mobile */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map((userItem) => (
              <div
                key={userItem.id}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-base mb-1">
                      {userItem.first_name || userItem.last_name
                        ? `${userItem.first_name || ''} ${userItem.last_name || ''}`.trim()
                        : 'Utilisateur'
                      }
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{userItem.email}</span>
                    </div>
                    {userItem.companies && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-3 h-3" />
                        {userItem.companies.name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/30">
                  <button
                    onClick={() => setEditingUser(userItem)}
                    className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setResettingPassword(userItem.id)}
                    className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(userItem.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal création/édition */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          clients={clients}
          onClose={() => {
            setShowCreateModal(false)
            setEditingUser(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingUser(null)
            loadUsers()
          }}
          currentUserId={user?.id}
        />
      )}

      {/* Modal réinitialisation mot de passe */}
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
  clients,
  onClose,
  onSuccess,
  currentUserId,
}: {
  user: User | null
  clients: Client[]
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
  const [companyId, setCompanyId] = useState(user?.company_id || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !companyId) {
      setError('Email et entreprise sont obligatoires')
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border/50 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Entreprise <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              disabled={!!user}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            >
              <option value="">Sélectionner une entreprise</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

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
                required={!user}
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
      </div>
    </div>
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border/50 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Réinitialiser le mot de passe
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
      </div>
    </div>
  )
}









