import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/subscriptions/create-custom
 * Créer une formule sur-mesure pour un client spécifique
 * 
 * Body: {
 *   clientName: string
 *   companyId: string
 *   price: number
 *   maxUsers?: number
 *   maxLeads?: number
 *   maxStorageGb?: number
 *   maxWorkflows?: number
 *   billingEmail: string
 *   features: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const supabase = await createServerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est admin plateforme
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.roles?.name !== 'Administrateur Plateforme') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé. Réservé aux administrateurs.' },
        { status: 403 }
      )
    }

    // Récupérer les données
    const body = await request.json()
    const {
      clientName,
      companyId,
      price,
      maxUsers,
      maxLeads,
      maxStorageGb,
      maxWorkflows,
      billingEmail,
      features
    } = body

    // Validation
    if (!clientName || !companyId || !price || !billingEmail) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants: clientName, companyId, price, billingEmail' },
        { status: 400 }
      )
    }

    console.log('🎨 Création formule custom pour:', clientName)

    // 1. Créer le produit Stripe
    const product = await stripe.products.create({
      name: `Talos Prime - Custom - ${clientName}`,
      description: `Formule sur-mesure pour ${clientName}`,
      metadata: {
        company_id: companyId,
        plan_type: 'custom',
        client_name: clientName
      }
    })

    console.log('✅ Produit Stripe créé:', product.id)

    // 2. Créer le prix Stripe
    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100), // Convertir en centimes
      currency: 'eur',
      recurring: {
        interval: 'month'
      },
      metadata: {
        company_id: companyId,
        client_name: clientName
      }
    })

    console.log('✅ Prix Stripe créé:', priceObj.id)

    // 3. Créer l'entrée dans subscription_plans
    const supabaseAdmin = createAdminClient()
    const { data: customPlan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .insert({
        name: `custom_${companyId.split('-')[0]}`, // Utiliser début du UUID pour unicité
        display_name: `Custom - ${clientName}`,
        description: `Formule sur-mesure pour ${clientName}`,
        price_monthly: price,
        stripe_product_id: product.id,
        stripe_price_id: priceObj.id,
        max_users: maxUsers || null,
        max_leads: maxLeads || null,
        max_clients: null,
        max_storage_gb: maxStorageGb || null,
        max_workflows: maxWorkflows || null,
        features: features || [],
        modules: ['leads', 'clients', 'workflows', 'exports', 'analytics'],
        is_active: true,
        sort_order: 99 // Les custom en dernier
      })
      .select()
      .single()

    if (planError) {
      console.error('❌ Erreur création plan:', planError)
      // Nettoyer Stripe si échec
      await stripe.products.del(product.id)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création du plan: ' + planError.message },
        { status: 500 }
      )
    }

    console.log('✅ Plan créé en BDD:', customPlan.id)

    // 4. Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [{
        price: priceObj.id,
        quantity: 1
      }],
      customer_email: billingEmail,
      client_reference_id: companyId,
      subscription_data: {
        metadata: {
          company_id: companyId,
          plan_id: customPlan.id,
          plan_type: 'custom',
          client_name: clientName
        }
      },
      metadata: {
        company_id: companyId,
        plan_id: customPlan.id,
        plan_type: 'custom',
        client_name: clientName
      },
      success_url: `https://www.talosprimes.com/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://www.talosprimes.com/billing?canceled=true`,
      locale: 'fr',
      billing_address_collection: 'required',
      allow_promotion_codes: false
    })

    console.log('✅ Session Stripe créée:', session.id)

    // 5. TODO: Envoyer email au client avec le lien
    // Vous pouvez déclencher un workflow N8N ici

    return NextResponse.json({
      success: true,
      plan: customPlan,
      checkoutUrl: session.url,
      sessionId: session.id,
      message: `Formule custom créée pour ${clientName} - ${price}€/mois`
    })

  } catch (error) {
    console.error('❌ Erreur création formule custom:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

