import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * API d'inscription de lead (pré-inscription)
 * 
 * Ce endpoint :
 * - Ne crée PAS de compte auth.users
 * - Ne génère PAS de mot de passe
 * - Crée uniquement une entrée dans platform_leads
 * - Déclenche le workflow N8N pour notifications
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { first_name, last_name, email, phone, company } = body

    console.log('📝 Nouvelle pré-inscription lead:', { first_name, last_name, email, phone, company })

    // ============================================================================
    // 1. VALIDATION
    // ============================================================================
    
    if (!first_name || !last_name || !email || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Les champs prénom, nom, email et téléphone sont requis',
        },
        { status: 400 }
      )
    }

    if (!phone.startsWith('+33')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le numéro de téléphone doit commencer par +33',
        },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "L'adresse email n'est pas valide",
        },
        { status: 400 }
      )
    }

    // ============================================================================
    // 2. VÉRIFIER SI L'EMAIL EXISTE DÉJÀ
    // ============================================================================
    
    const supabase = createAdminClient()

    // Vérifier dans platform_leads
    const { data: existingLead } = await supabase
      .from('platform_leads')
      .select('id, status')
      .eq('email', email)
      .single()

    if (existingLead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cet email est déjà enregistré. Nous vous contacterons très prochainement.',
          debug: {
            leadId: existingLead.id,
            status: existingLead.status,
          }
        },
        { status: 409 }
      )
    }

    // Vérifier dans auth.users (si déjà client actif)
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser.users.some(u => u.email === email)

    if (userExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un compte existe déjà avec cet email. Veuillez vous connecter.',
        },
        { status: 409 }
      )
    }

    // ============================================================================
    // 3. CRÉER LE LEAD DANS platform_leads
    // ============================================================================
    
    console.log('✨ Création du lead dans platform_leads...')

    const { data: newLead, error: leadError } = await supabase
      .from('platform_leads')
      .insert({
        email,
        first_name,
        last_name,
        phone,
        company_name: company || null,
        status: 'pre_registered',
        onboarding_step: 'form',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (leadError) {
      console.error('❌ Erreur création lead:', leadError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de l\'enregistrement de votre pré-inscription',
          debug: leadError,
        },
        { status: 500 }
      )
    }

    console.log('✅ Lead créé avec succès:', newLead.id)

    // ============================================================================
    // 4. DÉCLENCHER LE WORKFLOW N8N
    // ============================================================================
    
    try {
      console.log('🔄 Appel du workflow N8N inscription-lead...')

      const n8nResponse = await fetch(
        'https://n8n.talosprimes.com/webhook/inscription-lead',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lead_id: newLead.id,
            first_name,
            last_name,
            email,
            phone,
            company_name: company || null,
          }),
        }
      )

      if (n8nResponse.ok) {
        console.log('✅ Workflow N8N déclenché avec succès')
      } else {
        console.warn('⚠️ Workflow N8N échoué (non bloquant):', n8nResponse.status)
      }
    } catch (n8nError) {
      // Ne pas bloquer l'inscription si N8N échoue
      console.error('⚠️ Erreur N8N (non bloquant):', n8nError)
    }

    // ============================================================================
    // 5. RÉPONSE DE SUCCÈS
    // ============================================================================
    
    return NextResponse.json({
      success: true,
      message: 'Merci pour votre intérêt ! Nous vous contacterons sous 24h pour vous présenter notre plateforme.',
      lead_id: newLead.id,
    })

  } catch (error) {
    console.error('💥 Erreur lors de la pré-inscription:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

