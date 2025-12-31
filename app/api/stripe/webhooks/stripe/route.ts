import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

/**
 * POST /api/stripe/webhooks/stripe
 * Gère tous les webhooks envoyés par Stripe
 * 
 * Événements gérés:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */
export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('❌ Pas de signature Stripe')
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET non définie')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('❌ Erreur vérification signature webhook:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('📥 Webhook Stripe reçu:', event.type, event.id)

    const supabase = createAdminClient()

    // Gérer les différents types d'événements
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const companyId = subscription.metadata.company_id
        const planId = subscription.metadata.plan_id

        if (!companyId || !planId) {
          console.error('❌ Métadonnées manquantes:', subscription.metadata)
          break
        }

        // Récupérer le plan
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', planId)
          .single()

        if (!plan) {
          console.error('❌ Plan non trouvé:', planId)
          break
        }

        // Upsert subscription
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            company_id: companyId,
            plan_id: planId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
            amount: plan.price_monthly,
            currency: plan.currency,
            payment_method: 'card', // À améliorer
            next_payment_at: new Date(subscription.current_period_end * 1000).toISOString(),
            metadata: subscription.metadata as any,
          }, {
            onConflict: 'company_id'
          })

        if (subError) {
          console.error('❌ Erreur upsert subscription:', subError)
          break
        }

        // Créer entrée dans l'historique
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('company_id', companyId)
          .single()

        if (existingSub) {
          await supabase.from('subscription_history').insert({
            subscription_id: existingSub.id,
            company_id: companyId,
            event_type: event.type === 'customer.subscription.created' ? 'created' : 'updated',
            new_plan_id: planId,
            new_status: subscription.status,
            stripe_event_id: event.id,
            amount: plan.price_monthly,
            currency: plan.currency,
            details: {
              stripe_subscription_id: subscription.id,
              period_start: subscription.current_period_start,
              period_end: subscription.current_period_end,
            },
          })
        }

        console.log('✅ Subscription mise à jour:', subscription.id)

        // 🔔 Déclencher workflow N8N pour nouvel abonnement
        if (event.type === 'customer.subscription.created') {
          try {
            console.log('🔔 Déclenchement workflow N8N: abonnement-cree')
            const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL + '/webhook/abonnement-cree'
            
            // Récupérer les infos client
            const { data: company } = await supabase
              .from('companies')
              .select('name')
              .eq('id', companyId)
              .single()

            const { data: user } = await supabase
              .from('users')
              .select('email, first_name, last_name')
              .eq('company_id', companyId)
              .limit(1)
              .single()

            const n8nResponse = await fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventType: 'subscription_created',
                email: user?.email || '',
                first_name: user?.first_name || '',
                last_name: user?.last_name || '',
                company_name: company?.name || '',
                subscriptionId: subscription.id,
                planName: plan.display_name,
                amount: plan.price_monthly,
                currency: plan.currency || 'eur',
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              })
            })

            if (n8nResponse.ok) {
              console.log('✅ Workflow N8N "abonnement-cree" déclenché avec succès')
            } else {
              console.warn('⚠️ Workflow N8N échoué (non bloquant):', n8nResponse.status)
            }
          } catch (webhookError) {
            console.error('❌ Erreur webhook N8N (non bloquant):', webhookError)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const companyId = subscription.metadata.company_id

        if (!companyId) {
          console.error('❌ company_id manquant')
          break
        }

        // Mettre à jour le statut
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            ended_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('❌ Erreur mise à jour annulation:', updateError)
          break
        }

        // Historique
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id, plan_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (sub) {
          await supabase.from('subscription_history').insert({
            subscription_id: sub.id,
            company_id: companyId,
            event_type: 'canceled',
            old_status: 'active',
            new_status: 'canceled',
            stripe_event_id: event.id,
          })
        }

        console.log('✅ Subscription annulée:', subscription.id)

        // 🔔 Déclencher workflow N8N pour annulation abonnement
        try {
          console.log('🔔 Déclenchement workflow N8N: annuler-abonnement')
          const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL + '/webhook/annuler-abonnement'
          
          // Récupérer les infos client
          const { data: user } = await supabase
            .from('users')
            .select('email, first_name, last_name')
            .eq('company_id', companyId)
            .limit(1)
            .single()

          const { data: plan } = await supabase
            .from('subscription_plans')
            .select('display_name')
            .eq('id', sub?.plan_id)
            .single()

          const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'subscription_canceled',
              email: user?.email || '',
              first_name: user?.first_name || '',
              last_name: user?.last_name || '',
              plan_name: plan?.display_name || 'N/A',
              canceled_at: new Date().toISOString(),
              access_until: new Date(subscription.current_period_end * 1000).toISOString(),
              subscriptionId: subscription.id,
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
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        if (!invoice.subscription) break

        // Mettre à jour la date du dernier paiement
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            last_payment_at: new Date().toISOString(),
            status: 'active', // S'assurer que le statut est actif
          })
          .eq('stripe_subscription_id', invoice.subscription as string)

        if (updateError) {
          console.error('❌ Erreur mise à jour paiement:', updateError)
          break
        }

        // Historique
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id, company_id')
          .eq('stripe_subscription_id', invoice.subscription as string)
          .single()

        if (sub) {
          await supabase.from('subscription_history').insert({
            subscription_id: sub.id,
            company_id: sub.company_id,
            event_type: 'payment_succeeded',
            stripe_event_id: event.id,
            stripe_invoice_id: invoice.id,
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency || 'eur',
            details: {
              invoice_number: invoice.number,
              invoice_pdf: invoice.invoice_pdf,
            },
          })
        }

        console.log('✅ Paiement réussi:', invoice.id)

        // 🔔 Déclencher workflow N8N pour renouvellement abonnement
        if (sub) {
          try {
            console.log('🔔 Déclenchement workflow N8N: renouveler-abonnement')
            const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL + '/webhook/renouveler-abonnement'
            
            // Récupérer les infos complètes
            const { data: subscription } = await supabase
              .from('subscriptions')
              .select(`
                *,
                plan:subscription_plans(display_name, price_monthly)
              `)
              .eq('id', sub.id)
              .single()

            const { data: user } = await supabase
              .from('users')
              .select('email, first_name, last_name')
              .eq('company_id', sub.company_id)
              .limit(1)
              .single()

            const n8nResponse = await fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventType: 'payment_succeeded',
                email: user?.email || '',
                first_name: user?.first_name || '',
                last_name: user?.last_name || '',
                amount: (invoice.amount_paid || 0) / 100,
                currency: invoice.currency || 'eur',
                payment_date: new Date().toISOString(),
                plan_name: (subscription?.plan as any)?.display_name || 'N/A',
                invoice_number: invoice.number || '',
                invoice_pdf: invoice.invoice_pdf || '',
                next_payment_date: subscription?.next_payment_at || '',
                subscriptionId: invoice.subscription as string,
              })
            })

            if (n8nResponse.ok) {
              console.log('✅ Workflow N8N "renouveler-abonnement" déclenché avec succès')
            } else {
              console.warn('⚠️ Workflow N8N échoué (non bloquant):', n8nResponse.status)
            }
          } catch (webhookError) {
            console.error('❌ Erreur webhook N8N (non bloquant):', webhookError)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (!invoice.subscription) break

        // Mettre à jour le statut
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('stripe_subscription_id', invoice.subscription as string)

        if (updateError) {
          console.error('❌ Erreur mise à jour échec paiement:', updateError)
          break
        }

        // Historique
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id, company_id')
          .eq('stripe_subscription_id', invoice.subscription as string)
          .single()

        if (sub) {
          await supabase.from('subscription_history').insert({
            subscription_id: sub.id,
            company_id: sub.company_id,
            event_type: 'payment_failed',
            stripe_event_id: event.id,
            stripe_invoice_id: invoice.id,
            amount: (invoice.amount_due || 0) / 100,
            currency: invoice.currency || 'eur',
            details: {
              attempt_count: invoice.attempt_count,
              next_payment_attempt: invoice.next_payment_attempt,
            },
          })
        }

        console.log('❌ Paiement échoué:', invoice.id)

        // 🔔 Déclencher workflow N8N pour échec paiement
        if (sub) {
          try {
            console.log('🔔 Déclenchement workflow N8N: echec-paiement')
            const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL + '/webhook/echec-paiement'
            
            // Récupérer les infos complètes
            const { data: subscription } = await supabase
              .from('subscriptions')
              .select(`
                *,
                plan:subscription_plans(display_name, price_monthly)
              `)
              .eq('id', sub.id)
              .single()

            const { data: user } = await supabase
              .from('users')
              .select('email, first_name, last_name, phone')
              .eq('company_id', sub.company_id)
              .limit(1)
              .single()

            const n8nResponse = await fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventType: 'payment_failed',
                email: user?.email || '',
                first_name: user?.first_name || '',
                last_name: user?.last_name || '',
                phone: user?.phone || '',
                amount: (invoice.amount_due || 0) / 100,
                currency: invoice.currency || 'eur',
                plan_name: (subscription?.plan as any)?.display_name || 'N/A',
                attempt_count: invoice.attempt_count || 1,
                failure_reason: invoice.last_finalization_error?.message || 'Échec paiement',
                next_payment_attempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : null,
                company_id: sub.company_id,
                subscription_id: invoice.subscription as string,
              })
            })

            if (n8nResponse.ok) {
              console.log('✅ Workflow N8N "echec-paiement" déclenché avec succès')
            } else {
              console.warn('⚠️ Workflow N8N échoué (non bloquant):', n8nResponse.status)
            }
          } catch (webhookError) {
            console.error('❌ Erreur webhook N8N (non bloquant):', webhookError)
          }
        }
        break
      }

      default:
        console.log(`ℹ️ Événement non géré: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Erreur webhook Stripe:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

