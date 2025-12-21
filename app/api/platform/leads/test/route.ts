import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { sendOnboardingConfirmationEmail } from '@/lib/services/email'

/**
 * POST /api/platform/leads/test
 * Route de test pour créer un lead et vérifier l'envoi d'email
 * 
 * Body: { email: string, first_name?: string, last_name?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createPlatformClient()
    const body = await request.json()

    const { email, first_name, last_name, company_name } = body

    if (!email) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      )
    }

    // Créer un lead de test
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        email,
        first_name: first_name || 'Test',
        last_name: last_name || 'User',
        company_name: company_name || 'Test Company',
        status: 'pre_registered',
        onboarding_step: 'form',
      })
      .select()
      .single()

    if (insertError) {
      // Si le lead existe déjà, ce n'est pas grave, on continue
      if (insertError.code !== '23505') { // Unique violation
        throw insertError
      }
      
      // Récupérer le lead existant
      const { data: existingLead } = await supabase
        .from('leads')
        .select('*')
        .eq('email', email)
        .single()
      
      if (!existingLead) {
        throw new Error('Lead exists but could not be retrieved')
      }

      // Tester l'envoi d'email quand même
      const emailResult = await sendOnboardingConfirmationEmail(
        existingLead.email,
        existingLead.first_name && existingLead.last_name
          ? `${existingLead.first_name} ${existingLead.last_name}`
          : existingLead.first_name || existingLead.company_name || undefined
      )

      return NextResponse.json({
        message: 'Lead already exists, but email sent anyway',
        lead: existingLead,
        email: emailResult,
      })
    }

    // Envoyer l'email de confirmation
    const emailResult = await sendOnboardingConfirmationEmail(
      lead.email,
      lead.first_name && lead.last_name
        ? `${lead.first_name} ${lead.last_name}`
        : lead.first_name || lead.company_name || undefined
    )

    return NextResponse.json({
      message: 'Lead created and email sent successfully',
      lead,
      email: emailResult,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/platform/leads/test:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

