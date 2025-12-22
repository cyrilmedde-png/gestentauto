import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { sendOnboardingConfirmationEmail } from '@/lib/services/email'
import { sendOnboardingConfirmationSMS } from '@/lib/services/sms'

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

    const { email, first_name, last_name, company_name, phone } = body

    if (!email) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      )
    }

    // Créer un lead de test
    const { data: lead, error: insertError } = await supabase
      .from('platform_leads')
      .insert({
        email,
        first_name: first_name || 'Test',
        last_name: last_name || 'User',
        company_name: company_name || 'Test Company',
        phone: phone || null,
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
        .from('platform_leads')
        .select('*')
        .eq('email', email)
        .single()
      
      if (!existingLead) {
        throw new Error('Lead exists but could not be retrieved')
      }

      // Tester l'envoi d'email et SMS quand même
      const leadName = existingLead.first_name && existingLead.last_name
        ? `${existingLead.first_name} ${existingLead.last_name}`
        : existingLead.first_name || existingLead.company_name || undefined

      const emailResult = await sendOnboardingConfirmationEmail(
        existingLead.email,
        leadName
      )

      // Envoyer SMS si numéro fourni
      let smsResult = null
      if (phone || existingLead.phone) {
        try {
          smsResult = await sendOnboardingConfirmationSMS(
            phone || existingLead.phone!,
            leadName
          )
        } catch (smsError) {
          console.error('Error sending SMS in test route:', smsError)
          smsResult = { success: false, error: smsError instanceof Error ? smsError.message : 'Unknown error' }
        }
      }

      return NextResponse.json({
        message: 'Lead already exists, but email and SMS sent anyway',
        lead: existingLead,
        email: emailResult,
        sms: smsResult,
      })
    }

    // Envoyer l'email et SMS de confirmation
    const leadName = lead.first_name && lead.last_name
      ? `${lead.first_name} ${lead.last_name}`
      : lead.first_name || lead.company_name || undefined

    const emailResult = await sendOnboardingConfirmationEmail(
      lead.email,
      leadName
    )

    // Envoyer SMS si numéro fourni
    let smsResult = null
    if (lead.phone) {
      try {
        smsResult = await sendOnboardingConfirmationSMS(
          lead.phone,
          leadName
        )
      } catch (smsError) {
        console.error('Error sending SMS in test route:', smsError)
        smsResult = { success: false, error: smsError instanceof Error ? smsError.message : 'Unknown error' }
      }
    }

    return NextResponse.json({
      message: 'Lead created and email/SMS sent successfully',
      lead,
      email: emailResult,
      sms: smsResult,
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

