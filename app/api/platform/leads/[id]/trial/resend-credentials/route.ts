import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { sendEmail } from '@/lib/services/email'

/**
 * POST /api/platform/leads/[id]/trial/resend-credentials
 * Renvoyer les identifiants de l'essai par email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPlatformClient()
    const { id } = await params

    // Récupérer le lead et l'essai
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, email, first_name, last_name, company_name, phone')
      .eq('id', id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    const { data: trial, error: trialError } = await supabase
      .from('trials')
      .select('id, start_date, end_date, duration_days, enabled_modules')
      .eq('lead_id', id)
      .eq('status', 'active')
      .single()

    if (trialError || !trial) {
      return NextResponse.json(
        { error: 'Aucun essai actif trouvé pour ce lead' },
        { status: 404 }
      )
    }

    // Récupérer le questionnaire pour les modules recommandés
    const { data: questionnaire } = await supabase
      .from('onboarding_questionnaires')
      .select('recommended_modules, trial_config')
      .eq('lead_id', id)
      .single()

    const modulesToActivate = questionnaire?.recommended_modules || trial.enabled_modules || []
    const trialDuration = questionnaire?.trial_config?.duration_days || trial.duration_days || 7

    // Récupérer l'utilisateur pour obtenir le mot de passe (depuis Auth)
    // Note: On ne peut pas récupérer le mot de passe depuis Auth, donc on ne peut que renvoyer l'email
    // avec un message indiquant de réinitialiser le mot de passe si nécessaire

    const leadName = lead.first_name && lead.last_name
      ? `${lead.first_name} ${lead.last_name}`
      : lead.first_name || lead.company_name || undefined

    const loginUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?email=${encodeURIComponent(lead.email)}`
      : `/auth/login?email=${encodeURIComponent(lead.email)}`

    const endDate = new Date(trial.end_date)

    // Envoyer l'email de renvoi des identifiants
    try {
      await sendEmail({
        to: lead.email,
        subject: 'Vos identifiants TalosPrime - Essai gratuit',
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
                .credentials {
                  background-color: #fff;
                  padding: 20px;
                  margin: 20px 0;
                  border-left: 4px solid #26283d;
                  border-radius: 4px;
                }
                .credentials strong {
                  color: #26283d;
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
                .warning {
                  background-color: #fff3cd;
                  border: 1px solid #ffc107;
                  padding: 15px;
                  border-radius: 4px;
                  margin: 20px 0;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Vos identifiants TalosPrime</h1>
              </div>
              <div class="content">
                <p>Bonjour ${leadName || ''},</p>
                <p>Voici un rappel de vos identifiants de connexion à TalosPrime :</p>
                <div class="credentials">
                  <p><strong>Email :</strong> ${lead.email}</p>
                  <p><strong>Lien de connexion :</strong> <a href="${loginUrl}">${loginUrl}</a></p>
                </div>
                <div class="warning">
                  <p><strong>⚠️ Important :</strong></p>
                  <p>Si vous avez oublié votre mot de passe, vous pouvez le réinitialiser depuis la page de connexion.</p>
                </div>
                ${modulesToActivate.length > 0 ? `
                  <p>Modules activés pour votre essai :</p>
                  <ul>
                    ${modulesToActivate.map((module: string) => `<li>${module}</li>`).join('')}
                  </ul>
                ` : ''}
                <p>Votre essai se termine le <strong>${endDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
                <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                <p>L'équipe TalosPrime</p>
              </div>
            </body>
          </html>
        `.trim(),
        text: `
Bonjour ${leadName || ''},

Voici un rappel de vos identifiants de connexion à TalosPrime :

Email : ${lead.email}
Lien de connexion : ${loginUrl}

⚠️ IMPORTANT : Si vous avez oublié votre mot de passe, vous pouvez le réinitialiser depuis la page de connexion.

${modulesToActivate.length > 0 ? `\nMODULES ACTIVÉS :\n${modulesToActivate.map((m: string) => `- ${m}`).join('\n')}\n` : ''}

Votre essai se termine le ${endDate.toLocaleDateString('fr-FR')}.

Si vous avez des questions, n'hésitez pas à nous contacter.

L'équipe TalosPrime
        `.trim(),
      })
    } catch (emailError) {
      console.error('Error sending credentials email:', emailError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Email envoyé avec succès' })
  } catch (error) {
    console.error('Error in POST /api/platform/leads/[id]/trial/resend-credentials:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

