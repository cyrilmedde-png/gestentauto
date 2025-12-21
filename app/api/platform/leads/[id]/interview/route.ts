import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import type { InterviewUpdate } from '@/lib/types/onboarding'
import { sendInterviewConfirmationEmail } from '@/lib/services/email'
import { sendInterviewConfirmationSMS } from '@/lib/services/sms'

/**
 * POST /api/platform/leads/[id]/interview/schedule
 * Planifier un entretien pour un lead
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let supabase
    try {
      supabase = createPlatformClient()
    } catch (supabaseError) {
      console.error('Error creating Supabase client:', supabaseError)
      return NextResponse.json(
        { error: 'Configuration error: Supabase client could not be created' },
        { status: 500 }
      )
    }
    
    const { id } = await params

    // Vérifier que le lead existe et récupérer ses infos
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, status, onboarding_step, email, first_name, last_name, company_name, phone')
      .eq('id', id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    if (!body || !body.scheduled_at) {
      return NextResponse.json(
        { error: 'scheduled_at is required' },
        { status: 400 }
      )
    }

    // Valider le format de la date (doit être au format ISO)
    let scheduledAt = body.scheduled_at
    try {
      // Vérifier que c'est une date ISO valide
      const date = new Date(scheduledAt)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Expected ISO format.' },
          { status: 400 }
        )
      }
      // S'assurer que c'est bien au format ISO
      scheduledAt = date.toISOString()
    } catch (dateError) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Vérifier si un entretien existe déjà pour ce lead
    const { data: existingInterview } = await supabase
      .from('onboarding_interviews')
      .select('id')
      .eq('lead_id', id)
      .maybeSingle()

    let interview
    let interviewError

    if (existingInterview) {
      // Mettre à jour l'entretien existant
      const { data, error } = await supabase
        .from('onboarding_interviews')
        .update({
          scheduled_at: scheduledAt,
          status: body.status || 'scheduled',
          meeting_link: body.meeting_link || null,
          notes: body.notes || null,
          interviewer_id: body.interviewer_id || null,
        })
        .eq('lead_id', id)
        .select()
        .single()
      
      interview = data
      interviewError = error
    } else {
      // Créer un nouvel entretien
      const { data, error } = await supabase
        .from('onboarding_interviews')
        .insert({
          lead_id: id,
          scheduled_at: scheduledAt,
          status: body.status || 'scheduled',
          meeting_link: body.meeting_link || null,
          notes: body.notes || null,
          interviewer_id: body.interviewer_id || null,
        })
        .select()
        .single()
      
      interview = data
      interviewError = error
    }

    if (interviewError) {
      console.error('Error creating/updating interview:', interviewError)
      return NextResponse.json(
        { error: interviewError.message || 'Error saving interview', details: interviewError },
        { status: 500 }
      )
    }

    if (!interview) {
      return NextResponse.json(
        { error: 'Failed to save interview' },
        { status: 500 }
      )
    }

    // Mettre à jour le lead
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'interview_scheduled',
        onboarding_step: 'interview',
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating lead:', updateError)
      // On continue quand même
    }

    // Envoyer email et SMS de confirmation d'entretien (ne pas bloquer si ça échoue)
    const leadName = lead.first_name && lead.last_name 
      ? `${lead.first_name} ${lead.last_name}` 
      : lead.first_name || lead.company_name || undefined

    const scheduledDate = interview.scheduled_at ? new Date(interview.scheduled_at) : undefined
    const meetingLink = interview.meeting_link || undefined

    // Envoyer l'email
    try {
      await sendInterviewConfirmationEmail(
        lead.email,
        leadName,
        scheduledDate,
        meetingLink
      )
    } catch (emailError) {
      console.error('Error sending interview confirmation email:', emailError)
      // On continue quand même, l'email n'est pas critique
    }

    // Envoyer le SMS si un numéro de téléphone est fourni
    if (lead.phone) {
      try {
        await sendInterviewConfirmationSMS(
          lead.phone,
          leadName,
          scheduledDate,
          meetingLink
        )
      } catch (smsError) {
        console.error('Error sending interview confirmation SMS:', smsError)
        // On continue quand même, le SMS n'est pas critique
      }
    }

    return NextResponse.json({ interview }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/platform/leads/[id]/interview:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const errorDetails = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/platform/leads/[id]/interview
 * Récupérer l'entretien d'un lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let supabase
    try {
      supabase = createPlatformClient()
    } catch (supabaseError) {
      console.error('Error creating Supabase client:', supabaseError)
      return NextResponse.json(
        { error: 'Configuration error: Supabase client could not be created' },
        { status: 500 }
      )
    }
    
    const { id } = await params

    const { data: interview, error } = await supabase
      .from('onboarding_interviews')
      .select('*')
      .eq('lead_id', id)
      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({ interview: interview || null })
  } catch (error) {
    console.error('Error in GET /api/platform/leads/[id]/interview:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/platform/leads/[id]/interview
 * Mettre à jour un entretien (statut, notes, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let supabase
    try {
      supabase = createPlatformClient()
    } catch (supabaseError) {
      console.error('Error creating Supabase client:', supabaseError)
      return NextResponse.json(
        { error: 'Configuration error: Supabase client could not be created' },
        { status: 500 }
      )
    }
    
    const { id } = await params

    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Vérifier que l'entretien existe
    const { data: existingInterview, error: checkError } = await supabase
      .from('onboarding_interviews')
      .select('id')
      .eq('lead_id', id)
      .single()

    if (checkError || !existingInterview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      )
    }

    // Mettre à jour l'entretien
    const updateData: Partial<InterviewUpdate> = {}
    if (body.scheduled_at !== undefined) updateData.scheduled_at = body.scheduled_at
    if (body.status !== undefined) updateData.status = body.status
    if (body.meeting_link !== undefined) updateData.meeting_link = body.meeting_link
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.interviewer_id !== undefined) updateData.interviewer_id = body.interviewer_id

    const { data: interview, error: updateError } = await supabase
      .from('onboarding_interviews')
      .update(updateData)
      .eq('lead_id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Si l'entretien est complété, mettre à jour le lead
    if (body.status === 'completed') {
      await supabase
        .from('leads')
        .update({
          status: 'interview_scheduled', // Ou autre statut selon la logique
          onboarding_step: 'trial', // Prêt pour l'essai
        })
        .eq('id', id)
    }

    return NextResponse.json({ interview })
  } catch (error) {
    console.error('Error in PATCH /api/platform/leads/[id]/interview:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

