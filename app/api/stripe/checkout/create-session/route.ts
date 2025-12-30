import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { headers } from 'next/headers'

/**
 * POST /api/stripe/checkout/create-session
 * Crée une session Stripe Checkout pour souscrire à un abonnement
 * 
 * Body: { plan_id: string }
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

    // Récupérer le corps de la requête
    const body = await request.json()
    const { plan_id } = body

    if (!plan_id) {
      return NextResponse.json(
        { success: false, error: 'plan_id est requis' },
        { status: 400 }
      )
    }

    // Récupérer les infos utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, email, first_name, last_name, company_id, companies(name, email)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('❌ Erreur récupération user:', userError)
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer la formule demandée
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      console.error('❌ Erreur récupération plan:', planError)
      return NextResponse.json(
        { success: false, error: 'Formule non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que le plan a bien un stripe_price_id
    if (!plan.stripe_price_id) {
      return NextResponse.json(
        { success: false, error: 'Cette formule n\'est pas encore configurée dans Stripe' },
        { status: 400 }
      )
    }

    // Vérifier si l'entreprise a déjà un abonnement actif
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('company_id', userData.company_id)
      .in('status', ['active', 'trialing'])
      .single()

    if (existingSub) {
      return NextResponse.json(
        { success: false, error: 'Vous avez déjà un abonnement actif. Utilisez la fonctionnalité de changement de formule.' },
        { status: 400 }
      )
    }

    // Récupérer l'origin pour les URLs de callback
    const headersList = await headers()
    const origin = headersList.get('origin') || 'https://www.talosprimes.com'

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      customer_email: userData.email,
      client_reference_id: userData.company_id, // Pour retrouver la company après paiement
      subscription_data: {
        metadata: {
          company_id: userData.company_id,
          plan_id: plan.id,
          user_id: user.id,
        },
      },
      metadata: {
        company_id: userData.company_id,
        plan_id: plan.id,
        user_id: user.id,
      },
      success_url: `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?canceled=true`,
      locale: 'fr',
      billing_address_collection: 'required',
      allow_promotion_codes: true,
    })

    console.log('✅ Session Stripe créée:', session.id)

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('❌ Erreur création session Stripe:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création de la session',
      },
      { status: 500 }
    )
  }
}

