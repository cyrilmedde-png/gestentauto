/**
 * Configuration Stripe
 * Gestion centralisée de l'instance Stripe
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY n\'est pas définie dans les variables d\'environnement')
}

// Instance Stripe côté serveur
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
  appInfo: {
    name: 'Talos Prime',
    version: '1.0.0',
  },
})

// Configuration publique pour le client
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  currency: 'eur',
  locale: 'fr',
}

// URLs de callback
export const getCallbackUrls = (origin: string) => ({
  success: `${origin}/billing?success=true`,
  cancel: `${origin}/billing?canceled=true`,
})

// Vérifier que la clé publique est définie
if (!stripeConfig.publishableKey) {
  console.warn('⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY n\'est pas définie')
}

