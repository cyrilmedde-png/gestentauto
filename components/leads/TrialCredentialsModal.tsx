'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Copy, Check, Mail, ExternalLink } from 'lucide-react'

interface TrialCredentials {
  email: string
  temporary_password: string
  login_url: string
  modules_activated?: string[]
}

interface TrialCredentialsModalProps {
  isOpen: boolean
  onClose: () => void
  credentials: TrialCredentials
  leadName?: string
  onResendEmail?: () => Promise<void>
}

export function TrialCredentialsModal({
  isOpen,
  onClose,
  credentials,
  leadName,
  onResendEmail,
}: TrialCredentialsModalProps) {
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(credentials.temporary_password)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    } catch (err) {
      console.error('Erreur lors de la copie:', err)
    }
  }

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(credentials.email)
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } catch (err) {
      console.error('Erreur lors de la copie:', err)
    }
  }

  const handleResendEmail = async () => {
    if (!onResendEmail) return

    try {
      setSendingEmail(true)
      setEmailSent(false)
      await onResendEmail()
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'email:', err)
    } finally {
      setSendingEmail(false)
    }
  }

  // Construire l'URL complète de connexion
  const fullLoginUrl = credentials.login_url.startsWith('http')
    ? credentials.login_url
    : typeof window !== 'undefined'
    ? `${window.location.origin}${credentials.login_url}`
    : credentials.login_url

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Essai gratuit démarré avec succès ! 🎉"
      size="lg"
    >
      <div className="space-y-6">
        {/* Message de succès */}
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm">
            L'essai gratuit a été démarré avec succès pour {leadName || credentials.email}.
            Les identifiants de connexion ont été envoyés par email.
          </p>
        </div>

        {/* Identifiants */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Identifiants de connexion</h3>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Email
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-foreground font-mono text-sm">
                {credentials.email}
              </div>
              <button
                onClick={handleCopyEmail}
                className="px-3 py-3 bg-background border border-border rounded-lg hover:bg-background/70 active:bg-background/80 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Copier l'email"
              >
                {copiedEmail ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Mot de passe temporaire */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Mot de passe temporaire
              <span className="ml-2 text-xs text-yellow-400">(À changer à la première connexion)</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-foreground font-mono text-sm">
                {credentials.temporary_password}
              </div>
              <button
                onClick={handleCopyPassword}
                className="px-3 py-3 bg-background border border-border rounded-lg hover:bg-background/70 active:bg-background/80 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Copier le mot de passe"
              >
                {copiedPassword ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Lien de connexion */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Lien de connexion
            </label>
            <a
              href={fullLoginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 bg-background border border-border rounded-lg px-4 py-3 text-primary hover:bg-background/70 active:bg-background/80 transition-colors group"
            >
              <span className="text-sm truncate flex-1">{fullLoginUrl}</span>
              <ExternalLink className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Modules activés */}
        {credentials.modules_activated && credentials.modules_activated.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Modules activés</h3>
            <div className="flex flex-wrap gap-2">
              {credentials.modules_activated.map((module) => (
                <span
                  key={module}
                  className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-sm text-primary"
                >
                  {module}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          {onResendEmail && (
            <button
              onClick={handleResendEmail}
              disabled={sendingEmail}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
            >
              <Mail className="w-4 h-4" />
              {sendingEmail ? 'Envoi en cours...' : emailSent ? 'Email envoyé !' : 'Renvoyer par email'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-background border border-border text-foreground rounded-lg hover:bg-background/70 active:bg-background/80 transition-colors min-h-[44px] touch-manipulation"
          >
            Fermer
          </button>
        </div>

        {/* Message de confirmation email */}
        {emailSent && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            ✅ Email envoyé avec succès !
          </div>
        )}
      </div>
    </Modal>
  )
}

