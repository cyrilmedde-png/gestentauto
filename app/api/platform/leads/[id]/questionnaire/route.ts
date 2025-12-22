import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { generateRecommendations } from '@/lib/platform/recommendations'
import type { LeadUpdate } from '@/lib/types/onboarding'
import { sendEmail } from '@/lib/services/email'
import { sendQuestionnaireReminderSMS } from '@/lib/services/sms'
import { verifyPlatformUser, createForbiddenResponse } from '@/lib/middleware/platform-auth'

/**
 * POST /api/platform/leads/[id]/questionnaire
 * Sauvegarder les réponses du questionnaire et générer les recommandations
 * 
 * ⚠️ Accès réservé aux utilisateurs plateforme uniquement
 */
export async function POST(
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

    // Vérifier que le lead existe et récupérer ses infos
    const { data: lead, error: leadError } = await supabase
      .from('platform_leads')
      .select('id, status, email, first_name, last_name, company_name, phone')
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
      .from('platform_onboarding_questionnaires')
      .upsert({
        platform_lead_id: id,
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
        onConflict: 'platform_lead_id'
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
      .from('platform_leads')
      .update(updateLeadData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating lead:', updateError)
      // On continue quand même car le questionnaire est sauvegardé
    }

    // Envoyer email et SMS de confirmation de complétion du questionnaire (ne pas bloquer si ça échoue)
    const leadName = lead.first_name && lead.last_name 
      ? `${lead.first_name} ${lead.last_name}` 
      : lead.first_name || lead.company_name || undefined

    const nextStepText = recommendations.next_step === 'trial' 
      ? 'Vous pouvez maintenant démarrer votre essai gratuit de 7 jours !'
      : 'Notre équipe va vous contacter pour planifier un entretien.'

    const questionnaireLink = `${process.env.NEXT_PUBLIC_APP_URL || ''}/platform/leads/${id}/questionnaire`

    // Envoyer l'email
    try {
      await sendEmail({
        to: lead.email,
        subject: 'Questionnaire complété - TalosPrime',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background-color: #080808;
                  color: #fff;
                  padding: 20px;
                  text-align: center;
                  border-radius: 8px 8px 0 0;
                }
                .content {
                  background-color: #f9f9f9;
                  padding: 30px;
                  border-radius: 0 0 8px 8px;
                }
                .modules {
                  background-color: #fff;
                  padding: 15px;
                  margin: 20px 0;
                  border-left: 4px solid #26283d;
                }
                .button {
                  display: inline-block;
                  background-color: #26283d;
                  color: #fff;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 4px;
                  margin-top: 20px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Questionnaire complété</h1>
              </div>
              <div class="content">
                <p>Bonjour ${leadName || 'cher prospect'},</p>
                <p>Merci d'avoir complété notre questionnaire ! Nous avons bien reçu vos réponses.</p>
                ${recommendations.modules && recommendations.modules.length > 0 ? `
                  <div class="modules">
                    <h3>Modules recommandés pour vous :</h3>
                    <ul>
                      ${recommendations.modules.map((module: string) => `<li>${module}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                <p><strong>Prochaine étape :</strong> ${nextStepText}</p>
                <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                <p>Cordialement,<br>L'équipe TalosPrime</p>
              </div>
            </body>
          </html>
        `,
      })
    } catch (emailError) {
      console.error('Error sending questionnaire completion email:', emailError)
      // On continue quand même, l'email n'est pas critique
    }

    // Envoyer le SMS si un numéro de téléphone est fourni
    if (lead.phone) {
      try {
        await sendQuestionnaireReminderSMS(
          lead.phone,
          leadName,
          questionnaireLink
        )
      } catch (smsError) {
        console.error('Error sending questionnaire completion SMS:', smsError)
        // On continue quand même, le SMS n'est pas critique
      }
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

    const { data: questionnaire, error } = await supabase
      .from('platform_onboarding_questionnaires')
      .select('*')
      .eq('platform_lead_id', id)
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

