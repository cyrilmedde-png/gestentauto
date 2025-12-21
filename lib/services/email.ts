import { Resend } from 'resend'

/**
 * Initialise le client Resend
 */
function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set in environment variables')
    return null
  }

  return new Resend(apiKey)
}

/**
 * Configuration par défaut pour les emails
 */
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@talosprime.fr'
const DEFAULT_FROM_NAME = process.env.RESEND_FROM_NAME || 'TalosPrime'

/**
 * Interface pour les options d'envoi d'email
 */
export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

/**
 * Envoie un email via Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = createResendClient()
    
    if (!resend) {
      return {
        success: false,
        error: 'Resend client not initialized. RESEND_API_KEY is missing.',
      }
    }

    const from = options.from || `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`

    // Construire l'objet de configuration pour Resend
    const emailData: any = {
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    }

    // Ajouter html ou text (au moins un est requis)
    if (options.html) {
      emailData.html = options.html
    }
    if (options.text) {
      emailData.text = options.text
    }

    // Ajouter les options optionnelles
    if (options.replyTo) {
      emailData.replyTo = options.replyTo
    }
    if (options.cc) {
      emailData.cc = Array.isArray(options.cc) ? options.cc : [options.cc]
    }
    if (options.bcc) {
      emailData.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc]
    }

    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error('Resend error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Envoie un email de bienvenue
 */
export async function sendWelcomeEmail(to: string, name?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = 'Bienvenue sur TalosPrime'
  const html = `
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
          <h1>Bienvenue sur TalosPrime</h1>
        </div>
        <div class="content">
          <p>Bonjour ${name || 'cher utilisateur'},</p>
          <p>Nous sommes ravis de vous accueillir sur TalosPrime, votre plateforme de gestion d'entreprise complète.</p>
          <p>Votre compte a été créé avec succès. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.</p>
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          <p>Cordialement,<br>L'équipe TalosPrime</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to,
    subject,
    html,
  })
}

/**
 * Envoie un email de confirmation d'inscription (onboarding)
 */
export async function sendOnboardingConfirmationEmail(
  to: string,
  leadName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = 'Confirmation de votre pré-inscription - TalosPrime'
  const html = `
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
          .steps {
            margin: 20px 0;
          }
          .step {
            margin: 10px 0;
            padding: 10px;
            background-color: #fff;
            border-left: 4px solid #26283d;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Confirmation de pré-inscription</h1>
        </div>
        <div class="content">
          <p>Bonjour ${leadName || 'cher prospect'},</p>
          <p>Nous avons bien reçu votre pré-inscription sur TalosPrime.</p>
          <p>Voici les prochaines étapes :</p>
          <div class="steps">
            <div class="step"><strong>1.</strong> Complétez notre questionnaire pour mieux comprendre vos besoins</div>
            <div class="step"><strong>2.</strong> Planifiez un entretien avec notre équipe (optionnel)</div>
            <div class="step"><strong>3.</strong> Démarrer votre essai gratuit de 7 jours</div>
          </div>
          <p>Notre équipe vous contactera bientôt pour vous accompagner dans votre démarche.</p>
          <p>Cordialement,<br>L'équipe TalosPrime</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to,
    subject,
    html,
  })
}

/**
 * Envoie un email de relance pour compléter le questionnaire
 */
export async function sendQuestionnaireReminderEmail(
  to: string,
  leadName?: string,
  questionnaireLink?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = 'N\'oubliez pas de compléter votre questionnaire - TalosPrime'
  const html = `
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
          <h1>Complétez votre questionnaire</h1>
        </div>
        <div class="content">
          <p>Bonjour ${leadName || 'cher prospect'},</p>
          <p>Nous avons remarqué que vous n'avez pas encore complété notre questionnaire.</p>
          <p>Ce questionnaire nous permet de mieux comprendre vos besoins et de vous proposer une solution adaptée.</p>
          ${questionnaireLink ? `<p><a href="${questionnaireLink}" class="button">Compléter le questionnaire</a></p>` : ''}
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          <p>Cordialement,<br>L'équipe TalosPrime</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to,
    subject,
    html,
  })
}

/**
 * Envoie un email de confirmation d'entretien programmé
 */
export async function sendInterviewConfirmationEmail(
  to: string,
  leadName?: string,
  scheduledDate?: Date,
  meetingLink?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = 'Confirmation de votre entretien - TalosPrime'
  const dateStr = scheduledDate ? new Date(scheduledDate).toLocaleString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : 'prochainement'

  const html = `
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
          .info-box {
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
          <h1>Entretien confirmé</h1>
        </div>
        <div class="content">
          <p>Bonjour ${leadName || 'cher prospect'},</p>
          <p>Votre entretien avec notre équipe est confirmé.</p>
          <div class="info-box">
            <p><strong>Date et heure :</strong> ${dateStr}</p>
            ${meetingLink ? `<p><strong>Lien de la réunion :</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
          </div>
          <p>Nous sommes impatients de discuter avec vous de vos besoins et de vous présenter TalosPrime.</p>
          <p>À très bientôt,<br>L'équipe TalosPrime</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to,
    subject,
    html,
  })
}

