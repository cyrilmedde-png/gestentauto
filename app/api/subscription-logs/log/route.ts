import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/subscription-logs/log
 * API pour logger les événements depuis N8N et autres sources
 * 
 * Body:
 * - action: string (event_type, ex: "document_cree", "facture_envoyee")
 * - level: string ("info", "error", "warning")
 * - message: string (message descriptif)
 * - metadata: string (JSON stringifié, optionnel)
 * - company_id: string (UUID, optionnel)
 * - user_id: string (UUID, optionnel)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, level, message, metadata, company_id, user_id } = body

    // Validation
    if (!action || !level || !message) {
      return NextResponse.json(
        { success: false, error: 'action, level et message sont requis' },
        { status: 400 }
      )
    }

    // Valider level
    const validLevels = ['info', 'error', 'warning', 'success']
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { success: false, error: `level doit être: ${validLevels.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Parser metadata si fourni
    let details: Record<string, any> = { message }
    if (metadata) {
      try {
        const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata
        details = { ...parsedMetadata, message }
      } catch (e) {
        // Si metadata n'est pas un JSON valide, on l'ignore et on garde juste le message
        console.warn('Metadata invalide, ignoré:', e)
      }
    }

    // Récupérer ip_address et user_agent depuis les headers
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      null
    const user_agent = request.headers.get('user-agent') || null

    // Mapper level → status (pour la table subscription_logs)
    const status = level === 'info' ? 'info' : 
                   level === 'error' ? 'error' : 
                   level === 'warning' ? 'warning' : 
                   'success'

    // Préparer les données pour insertion
    const logData: any = {
      event_type: action,
      status,
      details,
      error_message: level === 'error' ? message : null,
      source: 'n8n',
      ip_address,
      user_agent,
    }

    // Ajouter company_id si fourni
    if (company_id) {
      logData.company_id = company_id
    }

    // Ajouter user_id si fourni
    if (user_id) {
      logData.user_id = user_id
    }

    // Insérer dans subscription_logs
    const { data: logEntry, error: insertError } = await supabase
      .from('subscription_logs')
      .insert(logData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erreur insertion log:', insertError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'insertion du log', details: insertError.message },
        { status: 500 }
      )
    }

    // Notifications automatiques si error ou warning
    if (status === 'error' || status === 'warning') {
      try {
        // Notifier la plateforme (tous les admins)
        await notifyPlatformAdmins(action, status, message, details, supabase)

        // Notifier le client si company_id présent
        if (company_id) {
          await notifyClientUsers(company_id, action, status, message, details, supabase)
        }
      } catch (notifError) {
        // Ne pas bloquer si les notifications échouent
        console.error('⚠️ Erreur notifications (non bloquante):', notifError)
      }
    }

    return NextResponse.json({
      success: true,
      log_id: logEntry.id,
      message: 'Log créé avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur API subscription-logs/log:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur serveur'
      },
      { status: 500 }
    )
  }
}

/**
 * Notifie tous les admins plateforme
 */
async function notifyPlatformAdmins(
  action: string,
  status: string,
  message: string,
  details: Record<string, any>,
  supabase: any
) {
  try {
    // Récupérer tous les admins plateforme (company_id = '00000000-0000-0000-0000-000000000000')
    const platformCompanyId = '00000000-0000-0000-0000-000000000000'
    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('id')
      .eq('company_id', platformCompanyId)

    if (adminsError || !admins || admins.length === 0) {
      console.warn('⚠️ Aucun admin plateforme trouvé pour notification')
      return
    }

    // Générer titre et message pour la plateforme
    const title = status === 'error' 
      ? `🚨 Erreur: ${action}`
      : `⚠️ Avertissement: ${action}`
    
    const platformMessage = `${message}\n\nDétails: ${JSON.stringify(details, null, 2)}`

    // Créer notifications pour chaque admin
    const notifications = admins.map((admin: any) => ({
      user_id: admin.id,
      type: status === 'error' ? 'error' : 'warning',
      title,
      message: platformMessage,
      data: { action, status, details },
      read: false,
      created_at: new Date().toISOString(),
    }))

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (notifError) {
      console.error('❌ Erreur création notifications plateforme:', notifError)
    } else {
      console.log(`✅ ${admins.length} notification(s) plateforme créée(s)`)
    }
  } catch (error) {
    console.error('❌ Erreur notifyPlatformAdmins:', error)
    throw error
  }
}

/**
 * Notifie les utilisateurs d'une entreprise (message rassurant)
 */
async function notifyClientUsers(
  company_id: string,
  action: string,
  status: string,
  message: string,
  details: Record<string, any>,
  supabase: any
) {
  try {
    // Récupérer tous les utilisateurs de la company
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('company_id', company_id)

    if (usersError || !users || users.length === 0) {
      console.warn(`⚠️ Aucun utilisateur trouvé pour company_id: ${company_id}`)
      return
    }

    // Générer titre et message rassurant pour le client
    const title = status === 'error'
      ? 'Information importante'
      : 'Notification système'
    
    // Messages rassurants selon le type d'action
    let clientMessage = message
    if (status === 'error') {
      if (action.includes('facture') || action.includes('document')) {
        clientMessage = `Nous avons rencontré un problème technique. Notre équipe a été automatiquement informée et intervient rapidement. Vous serez notifié dès que la situation sera résolue.`
      } else {
        clientMessage = `Un problème technique a été détecté. Notre équipe a été informée et intervient rapidement. Pas d'inquiétude, nous gérons la situation.`
      }
    } else if (status === 'warning') {
      clientMessage = `Information système: ${message}. Notre équipe surveille la situation.`
    }

    // Créer notifications pour chaque utilisateur
    const notifications = users.map((user: any) => ({
      user_id: user.id,
      type: status === 'error' ? 'warning' : 'info', // Pour le client, même les erreurs sont en "warning" pour ne pas alarmer
      title,
      message: clientMessage,
      data: { action, status, internal_message: message }, // Garder le message original dans data
      read: false,
      created_at: new Date().toISOString(),
    }))

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (notifError) {
      console.error('❌ Erreur création notifications client:', notifError)
    } else {
      console.log(`✅ ${users.length} notification(s) client créée(s) pour company_id: ${company_id}`)
    }
  } catch (error) {
    console.error('❌ Erreur notifyClientUsers:', error)
    throw error
  }
}

