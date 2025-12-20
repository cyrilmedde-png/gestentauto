import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'
import { randomBytes } from 'crypto'

/**
 * POST /api/platform/leads/[id]/trial/start
 * Démarrer un essai gratuit pour un lead
 * Crée automatiquement l'entreprise + utilisateur + modules activés
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      .from('leads')
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
      .from('trials')
      .select('*')
      .eq('lead_id', id)
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
      .from('onboarding_questionnaires')
      .select('*')
      .eq('lead_id', id)
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
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: lead.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: lead.first_name || null,
        last_name: lead.last_name || null,
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
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
      .from('trials')
      .insert({
        lead_id: id,
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
      .from('leads')
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
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPlatformClient()
    const { id } = await params

    const { data: trial, error } = await supabase
      .from('trials')
      .select(`
        *,
        companies (
          id,
          name,
          email
        )
      `)
      .eq('lead_id', id)
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

