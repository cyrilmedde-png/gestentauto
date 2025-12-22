import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'
import type { LeadUpdate } from '@/lib/types/onboarding'
import { verifyPlatformUser, createForbiddenResponse } from '@/lib/middleware/platform-auth'

/**
 * GET /api/platform/leads/[id]
 * Détails complets d'un lead (avec questionnaire, interview, trial)
 * 
 * ⚠️ Accès réservé aux utilisateurs plateforme uniquement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier que l'utilisateur est plateforme
    const { isPlatform, error: authError } = await verifyPlatformUser(request)
    
    if (!isPlatform) {
      return createForbiddenResponse(authError || 'Access denied. Platform user required.')
    }

    const supabase = createPlatformClient()
    const { id } = await params

    // Récupérer le lead
    const { data: lead, error: leadError } = await supabase
      .from('platform_leads')
      .select('*')
      .eq('id', id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Récupérer le questionnaire si existe
    const { data: questionnaire } = await supabase
      .from('platform_onboarding_questionnaires')
      .select('*')
      .eq('platform_lead_id', id)
      .single()

    // Récupérer l'entretien si existe
    const { data: interview } = await supabase
      .from('platform_onboarding_interviews')
      .select('*')
      .eq('platform_lead_id', id)
      .maybeSingle()

    // Récupérer l'essai si existe
    const { data: trial } = await supabase
      .from('platform_trials')
      .select('*')
      .eq('platform_lead_id', id)
      .maybeSingle()

    return NextResponse.json({
      lead,
      questionnaire: questionnaire || null,
      interview: interview || null,
      trial: trial || null,
    })
  } catch (error) {
    console.error('Error in GET /api/platform/leads/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/platform/leads/[id]
 * Mettre à jour un lead (statut, étape, etc.)
 * 
 * ⚠️ Accès réservé aux utilisateurs plateforme uniquement
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier que l'utilisateur est plateforme
    const { isPlatform, error: authError } = await verifyPlatformUser(request)
    
    if (!isPlatform) {
      return createForbiddenResponse(authError || 'Access denied. Platform user required.')
    }

    const supabase = createPlatformClient()
    const { id } = await params

    const body = await request.json()

    // Vérifier que le lead existe
    const { data: existingLead, error: checkError } = await supabase
      .from('platform_leads')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Mettre à jour le lead
    const updateData: Partial<LeadUpdate> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.onboarding_step !== undefined) updateData.onboarding_step = body.onboarding_step
    if (body.email !== undefined) updateData.email = body.email
    if (body.first_name !== undefined) updateData.first_name = body.first_name
    if (body.last_name !== undefined) updateData.last_name = body.last_name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.company_name !== undefined) updateData.company_name = body.company_name

    const { data: lead, error: updateError } = await supabase
      .from('platform_leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Error in PATCH /api/platform/leads/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/platform/leads/[id]
 * Supprimer un lead (et ses données associées via CASCADE)
 * 
 * ⚠️ Accès réservé aux utilisateurs plateforme uniquement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier que l'utilisateur est plateforme
    const { isPlatform, error: authError } = await verifyPlatformUser(request)
    
    if (!isPlatform) {
      return createForbiddenResponse(authError || 'Access denied. Platform user required.')
    }

    const supabase = createPlatformClient()
    const { id } = await params

    // Vérifier que le lead existe
    const { data: existingLead, error: checkError } = await supabase
      .from('platform_leads')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Supprimer le lead (les données associées seront supprimées via CASCADE)
    const { error: deleteError } = await supabase
      .from('platform_leads')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/platform/leads/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

