import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSecurePassword } from '@/lib/utils/passwordGenerator'

/**
 * API de création d'essai gratuit
 * 
 * Ce endpoint :
 * - Génère un mot de passe sécurisé
 * - Crée le compte auth.users
 * - Crée la company du client
 * - Crée le rôle "Propriétaire"
 * - Crée l'utilisateur dans public.users
 * - Crée l'essai dans platform_trials
 * - Met à jour le statut du lead
 * - Déclenche le workflow N8N pour envoyer les identifiants
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      lead_id, 
      duration_days = 14, 
      enabled_modules = [] 
    } = body

    console.log('🚀 Création essai gratuit...', { lead_id, duration_days, enabled_modules })

    // ============================================================================
    // 1. VALIDATION
    // ============================================================================
    
    if (!lead_id) {
      return NextResponse.json(
        { success: false, error: 'Le lead_id est requis' },
        { status: 400 }
      )
    }

    if (duration_days < 1 || duration_days > 30) {
      return NextResponse.json(
        { success: false, error: 'La durée doit être entre 1 et 30 jours' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // ============================================================================
    // 2. RÉCUPÉRER LE LEAD
    // ============================================================================
    
    console.log('📋 Récupération du lead...', lead_id)

    const { data: lead, error: leadError } = await supabase
      .from('platform_leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      console.error('❌ Lead non trouvé:', leadError)
      return NextResponse.json(
        { success: false, error: 'Lead non trouvé' },
        { status: 404 }
      )
    }

    console.log('✅ Lead trouvé:', lead.email)

    // Vérifier que le lead n'a pas déjà un essai
    if (lead.status === 'trial_started') {
      return NextResponse.json(
        { success: false, error: 'Ce lead a déjà un essai en cours' },
        { status: 409 }
      )
    }

    // ============================================================================
    // 3. GÉNÉRER UN MOT DE PASSE SÉCURISÉ
    // ============================================================================
    
    console.log('🔐 Génération du mot de passe...')
    const password = generateSecurePassword({ length: 12 })
    console.log('✅ Mot de passe généré')

    // ============================================================================
    // 4. CRÉER LE COMPTE AUTH.USERS
    // ============================================================================
    
    console.log('👤 Création du compte auth.users...')

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: lead.email,
      password,
      email_confirm: true, // Email déjà vérifié
      user_metadata: {
        first_name: lead.first_name,
        last_name: lead.last_name,
        phone: lead.phone,
        company: lead.company_name,
        is_trial: true,
        trial_duration_days: duration_days,
      },
    })

    if (authError) {
      console.error('❌ Erreur création auth:', authError)
      return NextResponse.json(
        { 
          success: false, 
          error: `Erreur lors de la création du compte: ${authError.message}` 
        },
        { status: 500 }
      )
    }

    console.log('✅ Compte auth créé:', authData.user.id)

    try {
      // ============================================================================
      // 5. CRÉER LA COMPANY
      // ============================================================================
      
      console.log('🏢 Création de la company...')

      const companyName = lead.company_name || `${lead.first_name} ${lead.last_name}`

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          email: lead.email,
          phone: lead.phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (companyError) {
        console.error('❌ Erreur création company:', companyError)
        throw new Error('Erreur lors de la création de l\'entreprise')
      }

      console.log('✅ Company créée:', companyData.id)

      // ============================================================================
      // 6. CRÉER LE RÔLE "PROPRIÉTAIRE"
      // ============================================================================
      
      console.log('👑 Création du rôle Propriétaire...')

      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .insert({
          company_id: companyData.id,
          name: 'Propriétaire',
          permissions: {
            all: true,
            admin: true,
            manage_users: true,
            manage_modules: true,
            manage_billing: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (roleError) {
        console.error('❌ Erreur création role:', roleError)
        throw new Error('Erreur lors de la création du rôle')
      }

      console.log('✅ Rôle créé:', roleData.id)

      // ============================================================================
      // 7. CRÉER L'UTILISATEUR DANS PUBLIC.USERS
      // ============================================================================
      
      console.log('📝 Création utilisateur dans public.users...')

      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        company_id: companyData.id,
        email: lead.email,
        first_name: lead.first_name,
        last_name: lead.last_name,
        phone: lead.phone,
        company: companyName,
        role_id: roleData.id,
        password_change_required: false, // Pas obligé pour les essais
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (userError) {
        console.error('❌ Erreur création user:', userError)
        throw new Error('Erreur lors de la création de l\'utilisateur')
      }

      console.log('✅ Utilisateur créé dans public.users')

      // ============================================================================
      // 8. CRÉER L'ESSAI DANS PLATFORM_TRIALS
      // ============================================================================
      
      console.log('⏰ Création de l\'essai...')

      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + duration_days)

      const { data: trialData, error: trialError } = await supabase
        .from('platform_trials')
        .insert({
          platform_lead_id: lead_id,
          company_id: companyData.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          duration_days,
          status: 'active',
          enabled_modules,
          trial_type: 'custom',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (trialError) {
        console.error('❌ Erreur création trial:', trialError)
        throw new Error('Erreur lors de la création de l\'essai')
      }

      console.log('✅ Essai créé:', trialData.id)

      // ============================================================================
      // 9. METTRE À JOUR LE STATUT DU LEAD
      // ============================================================================
      
      console.log('🔄 Mise à jour du statut du lead...')

      const { error: updateLeadError } = await supabase
        .from('platform_leads')
        .update({
          status: 'trial_started',
          onboarding_step: 'trial',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead_id)

      if (updateLeadError) {
        console.warn('⚠️ Erreur mise à jour lead (non bloquant):', updateLeadError)
      } else {
        console.log('✅ Statut du lead mis à jour')
      }

      // ============================================================================
      // 10. DÉCLENCHER LE WORKFLOW N8N POUR ENVOYER LES IDENTIFIANTS
      // ============================================================================
      
      try {
        console.log('📧 Envoi des identifiants via N8N...')

        const n8nResponse = await fetch(
          'https://n8n.talosprimes.com/webhook/creer-essai',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: lead.email,
              first_name: lead.first_name,
              last_name: lead.last_name,
              phone: lead.phone,
              company_name: companyName,
              password,
              trial_end_date: endDate.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              }),
              duration_days,
              enabled_modules,
            }),
          }
        )

        if (n8nResponse.ok) {
          console.log('✅ Email identifiants envoyé')
        } else {
          console.warn('⚠️ Erreur envoi email (non bloquant):', n8nResponse.status)
        }
      } catch (n8nError) {
        console.error('⚠️ Erreur N8N (non bloquant):', n8nError)
      }

      // ============================================================================
      // 11. RÉPONSE DE SUCCÈS
      // ============================================================================
      
      return NextResponse.json({
        success: true,
        message: 'Essai créé avec succès',
        data: {
          user_id: authData.user.id,
          company_id: companyData.id,
          trial_id: trialData.id,
          email: lead.email,
          password, // Renvoyé pour affichage dans l'interface admin
          trial_end_date: endDate.toISOString(),
          login_url: 'https://www.talosprimes.com/auth/login',
        },
      })

    } catch (error) {
      // ============================================================================
      // ROLLBACK : Supprimer le compte auth en cas d'erreur
      // ============================================================================
      
      console.error('💥 Erreur lors de la création de l\'essai:', error)
      console.log('🔄 Rollback : suppression du compte auth...')

      await supabase.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur lors de la création de l\'essai',
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 Erreur inattendue:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

