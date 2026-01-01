'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Trash2, Shield, AlertCircle, CheckCircle2, Mail, Users } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'

interface Admin {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
  company_id: string
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form state
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [sendEmail, setSendEmail] = useState(true)

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users/list-admins')
      const data = await response.json()
      
      if (data.success) {
        setAdmins(data.admins)
      } else {
        showMessage('error', data.error || 'Erreur lors du chargement')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('error', 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      showMessage('error', 'Email invalide')
      return
    }

    try {
      setAdding(true)
      
      const response = await fetch('/api/admin/users/add-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          first_name: firstName || null,
          last_name: lastName || null,
          send_email: sendEmail
        })
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', `✅ Administrateur ${email} ajouté avec succès`)
        setEmail('')
        setFirstName('')
        setLastName('')
        loadAdmins()
      } else {
        showMessage('error', data.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('error', 'Erreur de connexion')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveAdmin = async (adminId: string, adminEmail: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer les droits admin à ${adminEmail} ?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/users/remove-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: adminId })
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', `✅ ${adminEmail} n'est plus administrateur`)
        loadAdmins()
      } else {
        showMessage('error', data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('error', 'Erreur de connexion')
    }
  }

  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Administrateurs Plateforme</h1>
                <p className="text-gray-400 text-sm">Gérer les accès administrateurs</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-medium">{admins.length} Admin{admins.length > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-300' 
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <p>{message.text}</p>
              </div>
            </div>
          )}

          {/* Form Ajout Admin */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Ajouter un Administrateur</h2>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email * <span className="text-red-400">requis</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Prénom <span className="text-gray-600">optionnel</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jean"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nom <span className="text-gray-600">optionnel</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dupont"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="sendEmail" className="text-sm text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  Envoyer un email de bienvenue
                </label>
              </div>

              <button
                type="submit"
                disabled={adding || !email}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Ajouter l'Administrateur
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>ℹ️ Note :</strong> L'administrateur aura accès à toutes les fonctionnalités plateforme (logs, gestion plans, abonnements, etc.)
              </p>
            </div>
          </div>

          {/* Liste Admins */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Administrateurs Actuels</h2>
              <p className="text-sm text-gray-400 mt-1">
                Liste des utilisateurs avec accès administrateur
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400">Chargement...</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-lg font-medium">Aucun administrateur</p>
                <p className="text-gray-500 text-sm mt-1">
                  Ajoutez votre premier administrateur ci-dessus
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Administrateur
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Ajouté le
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin, index) => (
                      <tr 
                        key={admin.id}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          index % 2 === 0 ? 'bg-black/20' : 'bg-transparent'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {admin.first_name?.[0]?.toUpperCase() || admin.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {admin.first_name && admin.last_name 
                                  ? `${admin.first_name} ${admin.last_name}`
                                  : admin.first_name || admin.email.split('@')[0]
                                }
                              </p>
                              <p className="text-xs text-gray-500">ID: {admin.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300">{admin.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-400 text-sm">
                            {new Date(admin.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Retirer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-300">
                <p className="font-medium mb-1">⚠️ Attention</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                  <li>Les administrateurs ont accès à toutes les fonctionnalités sensibles</li>
                  <li>Retirer un admin ne supprime pas son compte, seulement ses droits admin</li>
                  <li>Un email doit d'abord exister dans auth.users pour être promu admin</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

