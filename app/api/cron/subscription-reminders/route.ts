import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/cron/subscription-reminders
 * Cron job qui envoie des rappels 7 jours avant le renouvellement
 * À configurer pour s'exécuter quotidiennement
 */
export async function GET(request: NextRequest) {
  try {
    // Vérification sécurité : token cron
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Créer client Supabase avec clé service (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Date J+7 (dans 7 jours)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 7)
    targetDate.setHours(0, 0, 0, 0) // Début de journée

    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    console.log('🔍 Recherche abonnements à renouveler entre:', {
      start: targetDate.toISOString(),
      end: nextDay.toISOString()
    })

    // Récupérer les abonnements qui se renouvellent dans 7 jours
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        stripe_subscription_id,
        amount,
        current_period_end,
        company_id,
        plan:subscription_plans (
          display_name,
          name
        )
      `)
      .eq('status', 'active')
      .gte('current_period_end', targetDate.toISOString())
      .lt('current_period_end', nextDay.toISOString())

    if (subError) {
      console.error('❌ Erreur récupération abonnements:', subError)
      return NextResponse.json(
        { success: false, error: 'Erreur récupération abonnements' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('✅ Aucun abonnement à renouveler dans 7 jours')
      return NextResponse.json({
        success: true,
        message: 'Aucun rappel à envoyer',
        count: 0
      })
    }

    console.log(`📧 ${subscriptions.length} rappel(s) à envoyer`)

    // Pour chaque abonnement, récupérer les infos utilisateur et envoyer rappel
    let successCount = 0
    let errorCount = 0

    for (const subscription of subscriptions) {
      try {
        // Récupérer l'utilisateur propriétaire (role_id = propriétaire)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, phone')
          .eq('company_id', subscription.company_id)
          .limit(1)
          .single()

        if (userError || !userData) {
          console.warn('⚠️ Utilisateur non trouvé pour subscription:', subscription.id)
          errorCount++
          continue
        }

        // Récupérer le moyen de paiement depuis Stripe (optionnel)
        let paymentMethod = 'Carte bancaire'
        try {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripe_subscription_id
          )
          if (stripeSubscription.default_payment_method) {
            const pm = await stripe.paymentMethods.retrieve(
              stripeSubscription.default_payment_method
            )
            paymentMethod = `${pm.card.brand.toUpperCase()} •••• ${pm.card.last4}`
          }
        } catch (stripeError) {
          console.warn('⚠️ Erreur récupération moyen paiement Stripe (non bloquant)')
        }

        // Déclencher workflow N8N
        const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL + '/webhook/rappel-renouvellement'
        
        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            phone: userData.phone || null,
            plan_name: subscription.plan?.display_name || subscription.plan?.name || 'N/A',
            amount: subscription.amount,
            renewal_date: new Date(subscription.current_period_end).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            payment_method: paymentMethod,
            subscription_id: subscription.stripe_subscription_id,
            app_url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.talosprimes.com'
          })
        })

        if (n8nResponse.ok) {
          console.log('✅ Rappel envoyé pour:', userData.email)
          successCount++
        } else {
          console.error('❌ Erreur N8N pour:', userData.email, n8nResponse.status)
          errorCount++
        }

      } catch (error) {
        console.error('❌ Erreur traitement subscription:', subscription.id, error)
        errorCount++
      }
    }

    console.log(`✅ Rappels envoyés: ${successCount}/${subscriptions.length}`)

    return NextResponse.json({
      success: true,
      message: `${successCount} rappel(s) envoyé(s) avec succès`,
      total: subscriptions.length,
      successCount,
      errorCount
    })

  } catch (error) {
    console.error('❌ Erreur cron rappels:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi des rappels'
      },
      { status: 500 }
    )
  }
}

