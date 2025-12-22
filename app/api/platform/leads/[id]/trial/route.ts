import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'
import { randomBytes } from 'crypto'
import { sendEmail } from '@/lib/services/email'
import { sendTrialStartSMS } from '@/lib/services/sms'
import { verifyPlatformUser, createForbiddenResponse } from '@/lib/middleware/platform-auth'

/**
 * POST /api/platform/leads/[id]/trial/start
 * Démarrer un essai gratuit pour un lead
 * Crée automatiquement l'entreprise + utilisateur + modules activés
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
    const platformId = await getPlatformCompanyId()
    const { id } = await params

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    // Vérifier que le lead existe et récupérer ses infos
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

    // Vérifier si un essai existe déjà
    const { data: existingTrial, error: trialCheckError } = await supabase
      .from('platform_trials')
      .select('*')
      .eq('platform_lead_id', id)
      .eq('status', 'active')
      .maybeSingle()

    if (trialCheckError) {
      throw trialCheckError
    }

    if (existingTrial) {
      return NextResponse.json(
        { error: 'An active trial already exists for this lead', trial: existingTrial },
        { status: 400 }
      )
    }

    // Récupérer le questionnaire pour avoir les recommandations
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('platform_onboarding_questionnaires')
      .select('*')
      .eq('platform_lead_id', id)
      .single()

    if (questionnaireError || !questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found. Please complete the questionnaire first.' },
        { status: 400 }
      )
    }

    // Générer un mot de passe temporaire
    const tempPassword = randomBytes(12).toString('base64').slice(0, 16) + '!'

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: createUserError } = await supabase.auth.admin.createUser({
      email: lead.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: lead.first_name || null,
        last_name: lead.last_name || null,
      },
    })

    if (createUserError || !authData.user) {
      return NextResponse.json(
        { error: createUserError?.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // 2. Créer l'entreprise
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: lead.company_name || `Entreprise ${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Nouvelle Entreprise',
        email: lead.email,
        phone: lead.phone || null,
        country: 'FR',
      })
      .select()
      .single()

    if (companyError || !companyData) {
      // Nettoyage : supprimer l'utilisateur Auth
      try {
        await supabase.auth.admin.deleteUser(userId)
      } catch {}
      
      return NextResponse.json(
        { error: companyError?.message || 'Failed to create company' },
        { status: 500 }
      )
    }

    // 3. Créer l'entrée utilisateur
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        company_id: companyData.id,
        email: lead.email,
        first_name: lead.first_name || null,
        last_name: lead.last_name || null,
      })

    if (userError) {
      // Nettoyage : supprimer l'entreprise et l'utilisateur Auth
      try {
        await supabase.from('companies').delete().eq('id', companyData.id)
        await supabase.auth.admin.deleteUser(userId)
      } catch {}
      
      return NextResponse.json(
        { error: userError.message || 'Failed to create user record' },
        { status: 500 }
      )
    }

    // 4. Activer les modules recommandés
    const modulesToActivate = questionnaire.recommended_modules || []
    if (modulesToActivate.length > 0) {
      const moduleInserts = modulesToActivate.map((moduleName: string) => ({
        company_id: companyData.id,
        module_name: moduleName,
        is_active: true,
        config: null,
      }))

      const { error: modulesError } = await supabase
        .from('modules')
        .insert(moduleInserts)

      if (modulesError) {
        console.error('Error activating modules:', modulesError)
        // On continue quand même, les modules pourront être activés plus tard
      }
    }

    // 5. Créer un rôle Admin par défaut
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .insert({
        company_id: companyData.id,
        name: 'Admin',
        permissions: {
          all_modules: true,
          users: { read: true, write: true, delete: true, create: true },
          settings: { read: true, write: true },
        },
      })
      .select()
      .single()

    if (!roleError && adminRole) {
      // Assigner le rôle à l'utilisateur
      await supabase
        .from('users')
        .update({ role_id: adminRole.id })
        .eq('id', userId)
    }

    // 6. Créer l'essai
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + (questionnaire.trial_config?.duration_days || 7))

    // Générer un token d'accès temporaire
    const accessToken = randomBytes(32).toString('hex')

    const { data: trial, error: trialError } = await supabase
      .from('platform_trials')
      .insert({
        platform_lead_id: id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        duration_days: questionnaire.trial_config?.duration_days || 7,
        status: 'active',
        enabled_modules: modulesToActivate,
        trial_type: questionnaire.trial_config?.type || 'custom',
        company_id: companyData.id,
        access_token: accessToken,
      })
      .select()
      .single()

    if (trialError) {
      console.error('Error creating trial:', trialError)
      // On continue quand même car l'entreprise est créée
    }

    // 7. Mettre à jour le lead
    await supabase
      .from('platform_leads')
      .update({
        status: 'trial_started',
        onboarding_step: 'trial',
      })
      .eq('id', id)

    // 8. Créer un setting pour marquer que c'est un essai
    await supabase
      .from('settings')
      .upsert({
        company_id: companyData.id,
        key: 'trial_mode',
        value: true,
      })

    // 9. Envoyer email et SMS de bienvenue avec les identifiants (ne pas bloquer si ça échoue)
    const leadName = lead.first_name && lead.last_name 
      ? `${lead.first_name} ${lead.last_name}` 
      : lead.first_name || lead.company_name || undefined

    const loginUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?email=${encodeURIComponent(lead.email)}`
      : `/auth/login?email=${encodeURIComponent(lead.email)}`

    // Envoyer l'email
    try {
      await sendEmail({
        to: lead.email,
        subject: 'Votre essai gratuit TalosPrime démarre maintenant !',
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
                  margin: 20px 0;
                  border-radius: 4px;
                }
                ${modulesToActivate.length > 0 ? `
                  .modules {
                    background-color: #fff;
                    padding: 15px;
                    margin: 20px 0;
                    border-left: 4px solid #26283d;
                  }
                ` : ''}
              </style>
            </head>
            <body>
              <div class="header">
                <h1>🎉 Votre essai gratuit démarre !</h1>
              </div>
              <div class="content">
                <p>Bonjour ${leadName || 'cher utilisateur'},</p>
                <p>Excellent ! Votre essai gratuit de ${questionnaire.trial_config?.duration_days || 7} jours sur TalosPrime est maintenant actif.</p>
                
                <div class="credentials">
                  <h3>Vos identifiants de connexion :</h3>
                  <p><strong>Email :</strong> ${lead.email}</p>
                  <p><strong>Mot de passe temporaire :</strong> ${tempPassword}</p>
                  <p class="warning"><strong>⚠️ Important :</strong> Nous vous recommandons fortement de changer ce mot de passe lors de votre première connexion.</p>
                  <p><a href="${loginUrl}" class="button">Se connecter maintenant</a></p>
                </div>

                ${modulesToActivate.length > 0 ? `
                  <div class="modules">
                    <h3>Modules activés pour votre essai :</h3>
                    <ul>
                      ${modulesToActivate.map((module: string) => `<li>${module}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                <p>Votre essai se termine le ${endDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
                
                <p>Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter. Nous sommes là pour vous accompagner !</p>
                
                <p>Bienvenue dans l'aventure TalosPrime,<br>L'équipe TalosPrime</p>
              </div>
            </body>
          </html>
        `,
        text: `
Bonjour ${leadName || 'cher utilisateur'},

Votre essai gratuit de ${questionnaire.trial_config?.duration_days || 7} jours sur TalosPrime est maintenant actif !

VOS IDENTIFIANTS DE CONNEXION :
Email : ${lead.email}
Mot de passe temporaire : ${tempPassword}

⚠️ IMPORTANT : Nous vous recommandons fortement de changer ce mot de passe lors de votre première connexion.

Lien de connexion : ${loginUrl}

${modulesToActivate.length > 0 ? `\nMODULES ACTIVÉS :\n${modulesToActivate.map((m: string) => `- ${m}`).join('\n')}\n` : ''}

Votre essai se termine le ${endDate.toLocaleDateString('fr-FR')}.

Si vous avez des questions, n'hésitez pas à nous contacter.

Bienvenue dans l'aventure TalosPrime,
L'équipe TalosPrime
        `.trim(),
      })
    } catch (emailError) {
      console.error('Error sending trial start email:', emailError)
      // On continue quand même, l'email n'est pas critique
    }

    // Envoyer le SMS si un numéro de téléphone est fourni
    if (lead.phone) {
      try {
        await sendTrialStartSMS(
          lead.phone,
          leadName,
          lead.email,
          tempPassword
        )
      } catch (smsError) {
        console.error('Error sending trial start SMS:', smsError)
        // On continue quand même, le SMS n'est pas critique
      }
    }

    return NextResponse.json({
      trial: trial || null,
      company: companyData,
      user: {
        id: userId,
        email: lead.email,
      },
      credentials: {
        email: lead.email,
        temporary_password: tempPassword,
        login_url: `/auth/login?email=${encodeURIComponent(lead.email)}`,
      },
      modules_activated: modulesToActivate,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/platform/leads/[id]/trial/start:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/platform/leads/[id]/trial
 * Récupérer l'essai d'un lead
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

    const { data: trial, error } = await supabase
      .from('platform_trials')
      .select(`
        *,
        companies (
          id,
          name,
          email
        )
      `)
      .eq('platform_lead_id', id)
      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({ trial: trial || null })
  } catch (error) {
    console.error('Error in GET /api/platform/leads/[id]/trial:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

