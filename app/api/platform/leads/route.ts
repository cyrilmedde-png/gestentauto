import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'
import { sendOnboardingConfirmationEmail } from '@/lib/services/email'
import { sendOnboardingConfirmationSMS } from '@/lib/services/sms'

/**
 * GET /api/platform/leads
 * Liste tous les leads avec filtres
 * Query params: ?status=xxx&step=xxx&email=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const step = searchParams.get('step')
    const email = searchParams.get('email')

    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (step) {
      query = query.eq('onboarding_step', step)
    }

    if (email) {
      query = query.ilike('email', `%${email}%`)
    }

    const { data: leads, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ leads: leads || [] })
  } catch (error) {
    console.error('Error in GET /api/platform/leads:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/platform/leads/pre-register
 * Pré-inscription : Formulaire initial
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createPlatformClient()

    const body = await request.json()
    const { email, first_name, last_name, phone, company_name } = body

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      )
    }

    // Vérifier si le lead existe déjà
    const { data: existingLead, error: checkError } = await supabase
      .from('leads')
      .select('id, status, onboarding_step')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (normal si nouveau lead)
      throw checkError
    }

    // Si le lead existe déjà, retourner ses infos
    if (existingLead) {
      return NextResponse.json({
        lead: existingLead,
        message: 'Lead already exists',
        existing: true,
      })
    }

    // Créer le nouveau lead
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        email,
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
        company_name: company_name || null,
        status: 'pre_registered',
        onboarding_step: 'form',
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Envoyer l'email et SMS de confirmation de pré-inscription (ne pas bloquer si ça échoue)
    const leadName = lead.first_name && lead.last_name 
      ? `${lead.first_name} ${lead.last_name}` 
      : lead.first_name || lead.company_name || undefined

    // Envoyer l'email
    try {
      await sendOnboardingConfirmationEmail(lead.email, leadName)
    } catch (emailError) {
      console.error('Error sending onboarding confirmation email:', emailError)
      // On continue quand même, l'email n'est pas critique
    }

    // Envoyer le SMS si un numéro de téléphone est fourni
    if (lead.phone) {
      try {
        await sendOnboardingConfirmationSMS(lead.phone, leadName)
      } catch (smsError) {
        console.error('Error sending onboarding confirmation SMS:', smsError)
        // On continue quand même, le SMS n'est pas critique
      }
    }

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/platform/leads:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

