import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { cookies } from 'next/headers'

/**
 * POST /api/stripe/subscriptions/cancel
 * Annule l'abonnement actif d'une entreprise
 * 
 * Body: { reason?: string, cancel_at_period_end?: boolean }
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

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

