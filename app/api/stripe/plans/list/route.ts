import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * GET /api/stripe/plans/list
 * Liste toutes les formules d'abonnement disponibles
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    // Récupérer toutes les formules actives
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('❌ Erreur récupération plans:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des formules' },
        { status: 500 }
      )
    }

    // Formater les données pour le client
    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.display_name,
      description: plan.description,
      price: plan.price_monthly,
      currency: plan.currency,
      billingPeriod: plan.billing_period,
      features: plan.features || [],
      modules: plan.modules || [],
      quotas: {
        maxUsers: plan.max_users,
        maxLeads: plan.max_leads,
        maxClients: plan.max_clients,
        maxStorageGb: plan.max_storage_gb,
        maxWorkflows: plan.max_workflows,
      },
      stripeProductId: plan.stripe_product_id,
      stripePriceId: plan.stripe_price_id,
    }))

    return NextResponse.json({
      success: true,
      plans: formattedPlans,
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/stripe/plans/list:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

