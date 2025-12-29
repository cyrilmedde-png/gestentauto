'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { useAuth } from '@/components/auth/AuthProvider'
import { UserPlus, Building2, User, Mail, Phone, MapPin, FileText, Save, X, CheckCircle } from 'lucide-react'

export default function PlatformOnboardingPage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Onboarding Client
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Créer un nouveau client et son compte administrateur
            </p>
          </div>

          <OnboardingForm />
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

function OnboardingForm() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Données entreprise
  const [companyName, setCompanyName] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyCity, setCompanyCity] = useState('')
  const [companyPostalCode, setCompanyPostalCode] = useState('')
  const [companyCountry, setCompanyCountry] = useState('FR')
  const [companySiret, setCompanySiret] = useState('')
  const [companyVatNumber, setCompanyVatNumber] = useState('')
  
  // Données administrateur
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('')
  const [adminFirstName, setAdminFirstName] = useState('')
  const [adminLastName, setAdminLastName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validation
    if (!companyName || !adminEmail || !adminPassword) {
      setError('Les champs marqués d\'un * sont obligatoires')
      return
    }

    if (adminPassword !== adminPasswordConfirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (adminPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch('/api/platform/onboarding', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          companyName,
          companyEmail: companyEmail || null,
          companyPhone: companyPhone || null,
          companyAddress: companyAddress || null,
          companyCity: companyCity || null,
          companyPostalCode: companyPostalCode || null,
          companyCountry,
          companySiret: companySiret || null,
          companyVatNumber: companyVatNumber || null,
          adminEmail,
          adminPassword,
          adminFirstName: adminFirstName || null,
          adminLastName: adminLastName || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du client')
      }

      setSuccess(`Client "${companyName}" créé avec succès ! L'administrateur peut maintenant se connecter avec ${adminEmail}`)
      
      // Réinitialiser le formulaire
      setCompanyName('')
      setCompanyEmail('')
      setCompanyPhone('')
      setCompanyAddress('')
      setCompanyCity('')
      setCompanyPostalCode('')
      setCompanyCountry('FR')
      setCompanySiret('')
      setCompanyVatNumber('')
      setAdminEmail('')
      setAdminPassword('')
      setAdminPasswordConfirm('')
      setAdminFirstName('')
      setAdminLastName('')

      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Entreprise */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Informations Entreprise</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom de l'entreprise <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Nom de l'entreprise"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="contact@entreprise.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Adresse
              </label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
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
                  value={companyPostalCode}
                  onChange={(e) => setCompanyPostalCode(e.target.value)}
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
                  value={companyCity}
                  onChange={(e) => setCompanyCity(e.target.value)}
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
                value={companyCountry}
                onChange={(e) => setCompanyCountry(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="FR">France</option>
                <option value="BE">Belgique</option>
                <option value="CH">Suisse</option>
                <option value="CA">Canada</option>
                <option value="US">États-Unis</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  SIRET
                </label>
                <input
                  type="text"
                  value={companySiret}
                  onChange={(e) => setCompanySiret(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="12345678901234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Numéro de TVA
                </label>
                <input
                  type="text"
                  value={companyVatNumber}
                  onChange={(e) => setCompanyVatNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="FR12345678901"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Administrateur */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Compte Administrateur</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={adminFirstName}
                  onChange={(e) => setAdminFirstName(e.target.value)}
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
                  value={adminLastName}
                  onChange={(e) => setAdminLastName(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="admin@entreprise.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Mot de passe <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Minimum 8 caractères"
                minLength={8}
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum 8 caractères</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirmer le mot de passe <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                required
                value={adminPasswordConfirm}
                onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Répétez le mot de passe"
                minLength={8}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bouton de soumission */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>Création en cours...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Créer le client</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}







