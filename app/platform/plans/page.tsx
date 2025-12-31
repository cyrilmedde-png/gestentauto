'use client'

import { useState, useEffect } from 'react'
import { Package, Edit, Save, X, Plus, AlertCircle, CheckCircle2, Trash2, Eye, EyeOff } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'

interface Plan {
  id: string
  name: string
  displayName: string
  description: string
  price: number
  stripeProductId: string | null
  stripePriceId: string | null
  quotas: {
    maxUsers: number | null
    maxLeads: number | null
    maxStorageGb: number | null
    maxWorkflows: number | null
  }
  features: string[]
  modules: string[]
  isActive: boolean
  sortOrder: number
}

function PlansManagementContent() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Plan>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/plans/list')
      const data = await response.json()
      
      if (data.success) {
        setPlans(data.plans)
      } else {
        showMessage('error', 'Erreur lors du chargement des plans')
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

  const startEdit = (plan: Plan) => {
    setEditingPlan(plan.id)
    setEditForm({
      displayName: plan.displayName,
      description: plan.description,
      price: plan.price,
      quotas: { ...plan.quotas },
      features: [...plan.features],
      isActive: plan.isActive
    })
  }

  const cancelEdit = () => {
    setEditingPlan(null)
    setEditForm({})
  }

  const savePlan = async (planId: string) => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/admin/plans/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          updates: editForm
        })
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', '✅ Plan modifié avec succès')
        setEditingPlan(null)
        setEditForm({})
        loadPlans() // Recharger les plans
      } else {
        showMessage('error', `❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('error', '❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (planId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/plans/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          isActive: !currentStatus
        })
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', `✅ Plan ${!currentStatus ? 'activé' : 'désactivé'}`)
        loadPlans()
      } else {
        showMessage('error', `❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('error', '❌ Erreur lors du changement de statut')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
          🎛️ Gestion des Plans
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Modifier les formules d'abonnement, quotas et fonctionnalités
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border flex items-start space-x-3 ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/50' 
            : 'bg-red-500/10 border-red-500/50'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Plans List */}
      <div className="space-y-6">
        {plans.map((plan) => {
          const isEditing = editingPlan === plan.id
          const isCustom = plan.name.startsWith('custom_')

          return (
            <div 
              key={plan.id}
              className="border border-border/50 rounded-lg overflow-hidden"
            >
              {/* Header */}
              <div className={`p-4 sm:p-6 flex items-center justify-between ${
                plan.isActive ? 'bg-primary/5' : 'bg-muted/30'
              }`}>
                <div className="flex items-center space-x-3">
                  <Package className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center space-x-2">
                      <span>{isEditing && editForm.displayName ? editForm.displayName : plan.displayName}</span>
                      {isCustom && (
                        <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-600 rounded-full">
                          Custom
                        </span>
                      )}
                      {!plan.isActive && (
                        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
                          Inactif
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isEditing && editForm.description ? editForm.description : plan.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Toggle Active */}
                  <button
                    onClick={() => toggleActive(plan.id, plan.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      plan.isActive 
                        ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    title={plan.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {plan.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>

                  {/* Edit/Save/Cancel */}
                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(plan)}
                      className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => savePlan(plan.id)}
                        disabled={saving}
                        className="p-2 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="p-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* Prix */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Prix mensuel
                  </label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.price || 0}
                        onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                        className="w-32 px-3 py-2 border border-border/50 rounded-lg bg-background text-foreground"
                      />
                      <span className="text-muted-foreground">€ / mois</span>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {plan.price}€ <span className="text-base font-normal text-muted-foreground">/mois</span>
                    </p>
                  )}
                </div>

                {/* Quotas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Max Users */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      Max Utilisateurs
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.quotas?.maxUsers || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          quotas: { ...editForm.quotas!, maxUsers: e.target.value ? parseInt(e.target.value) : null }
                        })}
                        placeholder="Illimité"
                        className="w-full px-3 py-2 border border-border/50 rounded-lg bg-background text-foreground text-sm"
                      />
                    ) : (
                      <p className="text-lg font-semibold text-foreground">
                        {plan.quotas.maxUsers || '∞'}
                      </p>
                    )}
                  </div>

                  {/* Max Leads */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      Max Leads/mois
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.quotas?.maxLeads || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          quotas: { ...editForm.quotas!, maxLeads: e.target.value ? parseInt(e.target.value) : null }
                        })}
                        placeholder="Illimité"
                        className="w-full px-3 py-2 border border-border/50 rounded-lg bg-background text-foreground text-sm"
                      />
                    ) : (
                      <p className="text-lg font-semibold text-foreground">
                        {plan.quotas.maxLeads || '∞'}
                      </p>
                    )}
                  </div>

                  {/* Max Storage */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      Stockage (GB)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.quotas?.maxStorageGb || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          quotas: { ...editForm.quotas!, maxStorageGb: e.target.value ? parseInt(e.target.value) : null }
                        })}
                        placeholder="Illimité"
                        className="w-full px-3 py-2 border border-border/50 rounded-lg bg-background text-foreground text-sm"
                      />
                    ) : (
                      <p className="text-lg font-semibold text-foreground">
                        {plan.quotas.maxStorageGb ? `${plan.quotas.maxStorageGb} GB` : '∞'}
                      </p>
                    )}
                  </div>

                  {/* Max Workflows */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      Max Workflows
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.quotas?.maxWorkflows || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          quotas: { ...editForm.quotas!, maxWorkflows: e.target.value ? parseInt(e.target.value) : null }
                        })}
                        placeholder="Illimité"
                        className="w-full px-3 py-2 border border-border/50 rounded-lg bg-background text-foreground text-sm"
                      />
                    ) : (
                      <p className="text-lg font-semibold text-foreground">
                        {plan.quotas.maxWorkflows || '∞'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fonctionnalités */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Fonctionnalités
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {(editForm.features || []).map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => {
                              const newFeatures = [...(editForm.features || [])]
                              newFeatures[index] = e.target.value
                              setEditForm({ ...editForm, features: newFeatures })
                            }}
                            className="flex-1 px-3 py-2 border border-border/50 rounded-lg bg-background text-foreground text-sm"
                          />
                          <button
                            onClick={() => {
                              const newFeatures = (editForm.features || []).filter((_, i) => i !== index)
                              setEditForm({ ...editForm, features: newFeatures })
                            }}
                            className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setEditForm({
                            ...editForm,
                            features: [...(editForm.features || []), 'Nouvelle fonctionnalité']
                          })
                        }}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter une fonctionnalité</span>
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Stripe IDs */}
                {(plan.stripeProductId || plan.stripePriceId) && (
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">Stripe</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {plan.stripeProductId && (
                        <p className="break-all">
                          <strong>Product ID:</strong> {plan.stripeProductId}
                        </p>
                      )}
                      {plan.stripePriceId && (
                        <p className="break-all">
                          <strong>Price ID:</strong> {plan.stripePriceId}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PlansManagementPage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <PlansManagementContent />
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

