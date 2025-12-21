import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import type { InterviewUpdate } from '@/lib/types/onboarding'
import { sendInterviewConfirmationEmail } from '@/lib/services/email'

/**
 * POST /api/platform/leads/[id]/interview/schedule
 * Planifier un entretien pour un lead
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPlatformClient()
    const { id } = await params

    // Vérifier que le lead existe et récupérer ses infos
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, status, onboarding_step, email, first_name, last_name, company_name')
      .eq('id', id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    if (!body.scheduled_at) {
      return NextResponse.json(
        { error: 'scheduled_at is required' },
        { status: 400 }
      )
    }

    // Créer ou mettre à jour l'entretien
    const { data: interview, error: interviewError } = await supabase
      .from('onboarding_interviews')
      .upsert({
        lead_id: id,
        scheduled_at: body.scheduled_at,
        status: body.status || 'scheduled',
        meeting_link: body.meeting_link || null,
        notes: body.notes || null,
        interviewer_id: body.interviewer_id || null,
      }, {
        onConflict: 'lead_id'
      })
      .select()
      .single()

    if (interviewError) {
      throw interviewError
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

    // Envoyer l'email de confirmation d'entretien (ne pas bloquer si ça échoue)
    try {
      const leadName = lead.first_name && lead.last_name 
        ? `${lead.first_name} ${lead.last_name}` 
        : lead.first_name || lead.company_name || undefined

      await sendInterviewConfirmationEmail(
        lead.email,
        leadName,
        interview.scheduled_at ? new Date(interview.scheduled_at) : undefined,
        interview.meeting_link || undefined
      )
    } catch (emailError) {
      console.error('Error sending interview confirmation email:', emailError)
      // On continue quand même, l'email n'est pas critique
    }

    return NextResponse.json({ interview }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/platform/leads/[id]/interview:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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
    const supabase = createPlatformClient()
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
    const supabase = createPlatformClient()
    const { id } = await params

    const body = await request.json()

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

