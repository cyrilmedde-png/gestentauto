/**
 * Fonction complète pour créer un lead avec toutes les notifications
 */

interface CreateLeadParams {
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
  source: 'web' | 'referral' | 'ads' | 'social' | 'other'
  notes?: string
  status?: 'new' | 'contacted' | 'qualified' | 'lost'
}

interface CreateLeadResult {
  success: boolean
  leadId?: string
  errors?: string[]
  notifications: {
    email: boolean
    sms: boolean
    n8n: boolean
  }
}

/**
 * Crée un lead complet avec toutes les notifications
 */
export async function createLeadComplete(
  params: CreateLeadParams
): Promise<CreateLeadResult> {
  const errors: string[] = []
  const notifications = {
    email: false,
    sms: false,
    n8n: false,
  }

  try {
    // 1. Créer le lead dans la base de données
    console.log('📝 Création du lead...')
    
    const leadResponse = await fetch('/api/platform/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: params.firstName,
        last_name: params.lastName,
        email: params.email,
        phone: params.phone,
        company: params.company,
        source: params.source,
        notes: params.notes,
        status: params.status || 'new',
      }),
    })

    if (!leadResponse.ok) {
      throw new Error('Erreur lors de la création du lead')
    }

    const lead = await leadResponse.json()
    console.log(`✅ Lead créé : ${lead.id}`)

    // 2. Envoyer l'email de bienvenue
    console.log('📧 Envoi de l\'email de bienvenue...')
    
    try {
      const emailResponse = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: params.email,
          subject: 'Bienvenue - Votre demande a été reçue',
          html: `
            <h1>Bonjour ${params.firstName} ${params.lastName}</h1>
            <p>Nous avons bien reçu votre demande. Notre équipe vous contactera dans les plus brefs délais.</p>
            
            <h2>Informations de votre demande :</h2>
            <ul>
              <li><strong>Email :</strong> ${params.email}</li>
              <li><strong>Téléphone :</strong> ${params.phone}</li>
              ${params.company ? `<li><strong>Entreprise :</strong> ${params.company}</li>` : ''}
            </ul>
            
            <p>Cordialement,<br>L'équipe Talos Prime</p>
          `,
        }),
      })

      if (emailResponse.ok) {
        notifications.email = true
        console.log('✅ Email envoyé')
      } else {
        errors.push('Erreur lors de l\'envoi de l\'email')
      }
    } catch (error) {
      console.error('Erreur email:', error)
      errors.push('Erreur lors de l\'envoi de l\'email')
    }

    // 3. Envoyer le SMS de confirmation
    console.log('📱 Envoi du SMS de confirmation...')
    
    try {
      const smsResponse = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: params.phone,
          message: `Bonjour ${params.firstName}, nous avons bien reçu votre demande. Notre équipe vous contactera prochainement. - Talos Prime`,
        }),
      })

      if (smsResponse.ok) {
        notifications.sms = true
        console.log('✅ SMS envoyé')
      } else {
        errors.push('Erreur lors de l\'envoi du SMS')
      }
    } catch (error) {
      console.error('Erreur SMS:', error)
      errors.push('Erreur lors de l\'envoi du SMS')
    }

    // 4. Déclencher le workflow N8N
    console.log('🔄 Déclenchement du workflow N8N...')
    
    try {
      const n8nResponse = await fetch('https://n8n.talosprimes.com/webhook/nouveau-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          first_name: params.firstName,
          last_name: params.lastName,
          email: params.email,
          phone: params.phone,
          company: params.company,
          source: params.source,
          notes: params.notes,
          created_at: new Date().toISOString(),
        }),
      })

      if (n8nResponse.ok) {
        notifications.n8n = true
        console.log('✅ Workflow N8N déclenché')
      } else {
        errors.push('Erreur lors du déclenchement du workflow N8N')
      }
    } catch (error) {
      console.error('Erreur N8N:', error)
      errors.push('Erreur lors du déclenchement du workflow N8N')
    }

    // 5. Retourner le résultat
    return {
      success: true,
      leadId: lead.id,
      errors: errors.length > 0 ? errors : undefined,
      notifications,
    }

  } catch (error) {
    console.error('Erreur lors de la création du lead:', error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
      notifications,
    }
  }
}

/**
 * Exemple d'utilisation depuis un composant React
 */
export async function handleCreateLead(formData: CreateLeadParams) {
  const result = await createLeadComplete(formData)

  if (result.success) {
    console.log(`🎉 Lead créé avec succès ! ID: ${result.leadId}`)
    console.log('Notifications:', result.notifications)
    
    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ Certaines notifications ont échoué:', result.errors)
    }

    return result.leadId
  } else {
    console.error('❌ Erreur lors de la création du lead:', result.errors)
    throw new Error(result.errors?.join(', '))
  }
}

