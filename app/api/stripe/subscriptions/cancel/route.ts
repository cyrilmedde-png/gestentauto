import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'

/**
 * POST /api/stripe/subscriptions/cancel
 * Annule l'abonnement actif d'une entreprise
 * 
 * Body: { reason?: string, cancel_at_period_end?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient(request)

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les infos utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer le body
    const body = await request.json()
    const { reason, cancel_at_period_end = true } = body

    // Récupérer l'abonnement actif
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', userData.company_id)
      .in('status', ['active', 'trialing', 'past_due'])
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { success: false, error: 'Aucun abonnement actif trouvé' },
        { status: 404 }
      )
    }

    // Annuler dans Stripe
    let stripeSubscription
    if (cancel_at_period_end) {
      // Annuler à la fin de la période (recommandé)
      stripeSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
          metadata: {
            cancel_reason: reason || 'Client request',
          },
        }
      )
    } else {
      // Annuler immédiatement
      stripeSubscription = await stripe.subscriptions.cancel(
        subscription.stripe_subscription_id,
        {
          cancellation_details: {
            comment: reason || 'Client request',
          },
        }
      )
    }

    // Mettre à jour dans la BDD
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_requested_at: new Date().toISOString(),
        cancel_reason: reason || null,
        canceled_at: cancel_at_period_end ? null : new Date().toISOString(),
        status: cancel_at_period_end ? 'active' : 'canceled',
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('❌ Erreur mise à jour BDD:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    // Créer entrée historique
    await supabase.from('subscription_history').insert({
      subscription_id: subscription.id,
      company_id: userData.company_id,
      event_type: 'canceled',
      old_status: subscription.status,
      new_status: cancel_at_period_end ? 'active' : 'canceled',
      details: {
        cancel_at_period_end,
        cancel_reason: reason,
        period_end: subscription.current_period_end,
      },
    })

    console.log('✅ Abonnement annulé:', subscription.stripe_subscription_id)

    // 🔔 Déclencher workflow N8N pour annulation (côté client)
    try {
      console.log('🔔 Déclenchement workflow N8N: annuler-abonnement')
      const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL + '/webhook/annuler-abonnement'
      
      // Récupérer le plan name
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('display_name')
        .eq('id', subscription.plan_id)
        .single()

      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'subscription_canceled_by_client',
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          plan_name: plan?.display_name || 'N/A',
          canceled_at: new Date().toISOString(),
          access_until: subscription.current_period_end,
          cancel_at_period_end: cancel_at_period_end,
          cancel_reason: reason || null,
          subscription_id: subscription.stripe_subscription_id,
        })
      })

      if (n8nResponse.ok) {
        console.log('✅ Workflow N8N "annuler-abonnement" déclenché avec succès')
      } else {
        console.warn('⚠️ Workflow N8N échoué (non bloquant):', n8nResponse.status)
      }
    } catch (webhookError) {
      console.error('❌ Erreur webhook N8N (non bloquant):', webhookError)
    }

    return NextResponse.json({
      success: true,
      message: cancel_at_period_end
        ? 'Votre abonnement sera annulé à la fin de la période en cours'
        : 'Votre abonnement a été annulé immédiatement',
      cancel_at: cancel_at_period_end
        ? subscription.current_period_end
        : new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Erreur annulation abonnement:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'annulation',
      },
      { status: 500 }
    )
  }
}

