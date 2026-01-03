import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'
import { sendOnboardingConfirmationEmail } from '@/lib/services/email'
import { sendOnboardingConfirmationSMS } from '@/lib/services/sms'
import { verifyPlatformUser, createForbiddenResponse } from '@/lib/middleware/platform-auth'

/**
 * GET /api/platform/leads
 * Liste tous les leads avec filtres
 * Query params: ?status=xxx&step=xxx&email=xxx
 * 
 * ⚠️ Accès réservé aux utilisateurs plateforme uniquement
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est plateforme
    const { isPlatform, error: authError } = await verifyPlatformUser(request)
    
    if (!isPlatform) {
      return createForbiddenResponse(authError || 'Access denied. Platform user required.')
    }

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

    // Utiliser uniquement platform_leads (table standard après migration)
    const tableName = 'platform_leads'
    
    let query = supabase
      .from(tableName)
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
      console.error('Error fetching leads from platform_leads:', {
        message: error.message,
        code: error.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      })
      
      // Vérifier si c'est une erreur "table not found"
      const errorCode = error.code || ''
      const errorMessage = String(error.message || '').toLowerCase()
      const isTableNotFound = 
        errorCode === 'PGRST205' ||
        errorCode === '42P01' ||
        errorCode === 'PGRST106' ||
        errorMessage.includes('could not find the table') ||
        errorMessage.includes('does not exist')
      
      if (isTableNotFound) {
        return NextResponse.json(
          { 
            error: 'Table platform_leads not found in database. Please check if migration SQL scripts were executed correctly. See docs/GUIDE_MIGRATION_SQL.md',
            details: error.message,
            code: error.code,
            hint: (error as any)?.hint || 'Make sure the table exists and RLS is configured correctly'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          type: 'supabase_error'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ leads: leads || [] })
  } catch (error) {
    console.error('Error in GET /api/platform/leads:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const errorCode = (error as any)?.code
    
    // Améliorer le message d'erreur pour les erreurs de table
    const errorMsgLower = errorMessage.toLowerCase()
    const isTableNotFound = 
      errorCode === 'PGRST205' || // Table not found in schema cache
      errorCode === '42P01' || // relation does not exist
      errorCode === 'PGRST106' ||
      errorMsgLower.includes('could not find the table') ||
      errorMsgLower.includes('does not exist')
    
    if (isTableNotFound) {
      return NextResponse.json(
        { 
          error: 'Database table not found. Please check if migration SQL scripts were executed. See docs/GUIDE_MIGRATION_SQL.md',
          details: errorMessage,
          code: errorCode,
          hint: 'Make sure the table "platform_leads" or "leads" exists in Supabase'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: errorCode,
        type: 'internal_server_error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/platform/leads/pre-register
 * Pré-inscription : Formulaire initial
 * 
 * ⚠️ Accès réservé aux utilisateurs plateforme uniquement
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est plateforme
    const { isPlatform, error: authError } = await verifyPlatformUser(request)
    
    if (!isPlatform) {
      return createForbiddenResponse(authError || 'Access denied. Platform user required.')
    }

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

    // Utiliser platform_leads (table standard après migration)
    const tableName = 'platform_leads'
    
    // Vérifier si le lead existe déjà
    const { data: existingLead, error: checkError } = await supabase
      .from(tableName)
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
      .from(tableName)
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

    // Logger la création du lead
    try {
      const { createAdminClient } = await import('@/lib/supabase/server')
      const adminSupabase = createAdminClient()
      
      await adminSupabase.from('subscription_logs').insert({
        event_type: 'lead_cree',
        status: 'info',
        details: {
          lead_id: lead.id,
          email: lead.email,
          first_name: lead.first_name,
          last_name: lead.last_name,
          company_name: lead.company_name,
          message: `Lead créé: ${lead.first_name || ''} ${lead.last_name || ''} (${lead.email})`.trim()
        },
        source: 'platform_api',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      })
    } catch (logError) {
      // Ne pas bloquer si le log échoue
      console.error('Error logging lead creation:', logError)
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

