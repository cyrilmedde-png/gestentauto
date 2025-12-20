import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { generateRecommendations } from '@/lib/platform/recommendations'
import type { LeadUpdate } from '@/lib/types/onboarding'

/**
 * POST /api/platform/leads/[id]/questionnaire
 * Sauvegarder les réponses du questionnaire et générer les recommandations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPlatformClient()
    const { id } = await params

    // Vérifier que le lead existe
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, status')
      .eq('id', id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Valider les champs requis
    if (!body.request_type) {
      return NextResponse.json(
        { error: 'request_type is required' },
        { status: 400 }
      )
    }

    // Générer les recommandations automatiques
    const recommendations = generateRecommendations(body)

    // Créer ou mettre à jour le questionnaire
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('onboarding_questionnaires')
      .upsert({
        lead_id: id,
        request_type: body.request_type,
        business_sector: body.business_sector || null,
        business_size: body.business_size || null,
        current_tools: body.current_tools || null,
        main_needs: body.main_needs || null,
        budget_range: body.budget_range || null,
        timeline: body.timeline || null,
        additional_info: body.additional_info || null,
        recommended_modules: recommendations.modules,
        trial_config: recommendations.trial_config,
      }, {
        onConflict: 'lead_id'
      })
      .select()
      .single()

    if (questionnaireError) {
      throw questionnaireError
    }

    // Mettre à jour le lead : statut et étape
    const updateLeadData: LeadUpdate = {
      status: 'questionnaire_completed',
      onboarding_step: recommendations.next_step === 'trial' ? 'trial' : 'interview',
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update(updateLeadData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating lead:', updateError)
      // On continue quand même car le questionnaire est sauvegardé
    }

    return NextResponse.json({
      questionnaire,
      recommendations: {
        modules: recommendations.modules,
        trial_config: recommendations.trial_config,
        next_step: recommendations.next_step,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/platform/leads/[id]/questionnaire:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/platform/leads/[id]/questionnaire
 * Récupérer le questionnaire d'un lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPlatformClient()
    const { id } = await params

    const { data: questionnaire, error } = await supabase
      .from('onboarding_questionnaires')
      .select('*')
      .eq('lead_id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Pas de questionnaire trouvé
        return NextResponse.json(
          { questionnaire: null },
          { status: 200 }
        )
      }
      throw error
    }

    return NextResponse.json({ questionnaire })
  } catch (error) {
    console.error('Error in GET /api/platform/leads/[id]/questionnaire:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

