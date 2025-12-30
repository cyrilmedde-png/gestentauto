import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'

/**
 * POST /api/stripe/subscriptions/change-plan
 * Change la formule d'abonnement (upgrade ou downgrade)
 * 
 * Body: { new_plan_id: string }
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
    const { new_plan_id } = body

    if (!new_plan_id) {
      return NextResponse.json(
        { success: false, error: 'new_plan_id est requis' },
        { status: 400 }
      )
    }

    // Récupérer l'abonnement actif
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('company_id', userData.company_id)
      .eq('status', 'active')
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { success: false, error: 'Aucun abonnement actif trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que ce n'est pas la même formule
    if (subscription.plan_id === new_plan_id) {
      return NextResponse.json(
        { success: false, error: 'Vous êtes déjà sur cette formule' },
        { status: 400 }
      )
    }

    // Récupérer la nouvelle formule
    const { data: newPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', new_plan_id)
      .eq('is_active', true)
      .single()

    if (planError || !newPlan) {
      return NextResponse.json(
        { success: false, error: 'Nouvelle formule non trouvée' },
        { status: 404 }
      )
    }

    if (!newPlan.stripe_price_id) {
      return NextResponse.json(
        { success: false, error: 'Cette formule n\'est pas encore configurée dans Stripe' },
        { status: 400 }
      )
    }

    // Récupérer l'abonnement Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    )

    // Mettre à jour l'abonnement Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPlan.stripe_price_id,
          },
        ],
        proration_behavior: 'create_prorations', // Créer un prorata automatiquement
        metadata: {
          ...stripeSubscription.metadata,
          plan_id: new_plan_id,
          changed_at: new Date().toISOString(),
        },
      }
    )

    // Mettre à jour dans la BDD
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan_id: new_plan_id,
        amount: newPlan.price_monthly,
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
    const isUpgrade = newPlan.price_monthly > subscription.plan.price_monthly
    await supabase.from('subscription_history').insert({
      subscription_id: subscription.id,
      company_id: userData.company_id,
      event_type: isUpgrade ? 'upgraded' : 'downgraded',
      old_plan_id: subscription.plan_id,
      new_plan_id: new_plan_id,
      old_status: subscription.status,
      new_status: 'active',
      amount: newPlan.price_monthly,
      currency: newPlan.currency,
      details: {
        old_plan_name: subscription.plan.name,
        new_plan_name: newPlan.name,
        old_price: subscription.plan.price_monthly,
        new_price: newPlan.price_monthly,
        proration_applied: true,
      },
    })

    console.log('✅ Formule changée:', subscription.stripe_subscription_id)

    return NextResponse.json({
      success: true,
      message: isUpgrade 
        ? `Vous avez été upgradé vers ${newPlan.display_name}. Le prorata sera appliqué sur votre prochaine facture.`
        : `Vous avez été downgradé vers ${newPlan.display_name}. Le changement est effectif immédiatement avec prorata.`,
      subscription: {
        id: subscription.id,
        plan: {
          name: newPlan.name,
          displayName: newPlan.display_name,
          price: newPlan.price_monthly,
        },
        nextPaymentAmount: updatedSubscription.items.data[0].price.unit_amount ? 
          updatedSubscription.items.data[0].price.unit_amount / 100 : 
          newPlan.price_monthly,
      },
    })
  } catch (error) {
    console.error('❌ Erreur changement formule:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du changement de formule',
      },
      { status: 500 }
    )
  }
}

