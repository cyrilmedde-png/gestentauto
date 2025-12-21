import twilio from 'twilio'

/**
 * Initialise le client Twilio
 */
function createTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    console.warn('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is not set in environment variables')
    return null
  }

  return twilio(accountSid, authToken)
}

/**
 * Numéro d'expéditeur par défaut
 */
const DEFAULT_FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER

/**
 * Interface pour les options d'envoi de SMS
 */
export interface SendSMSOptions {
  to: string // Numéro au format international (ex: +33612345678)
  message: string
  from?: string // Numéro Twilio (optionnel, utilise TWILIO_PHONE_NUMBER par défaut)
}

/**
 * Envoie un SMS via Twilio
 */
export async function sendSMS(options: SendSMSOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const client = createTwilioClient()
    
    if (!client) {
      return {
        success: false,
        error: 'Twilio client not initialized. TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required.',
      }
    }

    const from = options.from || DEFAULT_FROM_NUMBER

    if (!from) {
      return {
        success: false,
        error: 'No phone number configured. Set TWILIO_PHONE_NUMBER in environment variables.',
      }
    }

    // Valider le format du numéro (doit commencer par +)
    const toNumber = options.to.startsWith('+') ? options.to : `+${options.to}`

    const message = await client.messages.create({
      body: options.message,
      to: toNumber,
      from: from,
    })

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error) {
    console.error('Error sending SMS:', error)
    
    // Gérer les erreurs spécifiques de Twilio
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Unknown error occurred',
    }
  }
}

/**
 * Envoie un SMS de confirmation de pré-inscription
 */
export async function sendOnboardingConfirmationSMS(
  phoneNumber: string,
  leadName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `Bonjour ${leadName || 'cher prospect'}, nous avons bien reçu votre pré-inscription sur TalosPrime. Notre équipe vous contactera bientôt. Merci !`

  return sendSMS({
    to: phoneNumber,
    message,
  })
}

/**
 * Envoie un SMS de rappel pour compléter le questionnaire
 */
export async function sendQuestionnaireReminderSMS(
  phoneNumber: string,
  leadName?: string,
  questionnaireLink?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const baseMessage = `Bonjour ${leadName || 'cher prospect'}, n'oubliez pas de compléter votre questionnaire TalosPrime pour que nous puissions mieux vous accompagner.`
  const message = questionnaireLink 
    ? `${baseMessage} Accédez au questionnaire : ${questionnaireLink}`
    : baseMessage

  return sendSMS({
    to: phoneNumber,
    message,
  })
}

/**
 * Envoie un SMS de confirmation d'entretien programmé
 */
export async function sendInterviewConfirmationSMS(
  phoneNumber: string,
  leadName?: string,
  scheduledDate?: Date,
  meetingLink?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const dateStr = scheduledDate 
    ? new Date(scheduledDate).toLocaleString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'prochainement'

  let message = `Bonjour ${leadName || 'cher prospect'}, votre entretien TalosPrime est confirmé pour le ${dateStr}.`
  
  if (meetingLink) {
    message += ` Lien : ${meetingLink}`
  }

  return sendSMS({
    to: phoneNumber,
    message,
  })
}

/**
 * Envoie un SMS de démarrage d'essai avec identifiants
 */
export async function sendTrialStartSMS(
  phoneNumber: string,
  leadName?: string,
  email?: string,
  temporaryPassword?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `Bonjour ${leadName || 'cher utilisateur'}, votre essai TalosPrime démarre maintenant ! Email: ${email || 'fourni par email'}. Mot de passe temporaire: ${temporaryPassword || 'fourni par email'}. Changez-le dès votre première connexion. Bienvenue !`

  return sendSMS({
    to: phoneNumber,
    message,
  })
}

