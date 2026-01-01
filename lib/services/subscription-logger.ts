/**
 * Service de logging centralisé pour les événements d'abonnements
 * Envoie les logs vers N8N qui les stocke dans Supabase
 */

export type LogStatus = 'success' | 'error' | 'warning' | 'info'

export type LogEventType =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_canceled'
  | 'subscription_renewed'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'payment_retry'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'plan_modified'
  | 'trial_started'
  | 'trial_ended'
  | 'account_suspended'
  | 'account_reactivated'
  | 'reminder_sent'
  | 'webhook_received'
  | 'cron_executed'
  | 'custom'

export interface SubscriptionLogData {
  event_type: LogEventType
  status: LogStatus
  subscription_id?: string
  company_id?: string
  user_id?: string
  details?: Record<string, any>
  error_message?: string
  source?: 'api' | 'webhook' | 'cron' | 'n8n' | 'manual'
  ip_address?: string
  user_agent?: string
}

/**
 * Logger centralisé pour les abonnements
 */
export class SubscriptionLogger {
  private static n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL + '/webhook/log-subscription'
  private static appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.talosprimes.com'

  /**
   * Log un événement d'abonnement
   */
  static async log(data: SubscriptionLogData): Promise<void> {
    try {
      const payload = {
        ...data,
        app_url: this.appUrl,
        timestamp: new Date().toISOString()
      }

      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        console.warn('⚠️ Échec log N8N (non bloquant):', response.status)
      } else {
        console.log(`✅ Log enregistré: ${data.event_type} (${data.status})`)
      }
    } catch (error) {
      // Ne pas bloquer l'exécution si le logging échoue
      console.error('❌ Erreur logging (non bloquant):', error)
    }
  }

  /**
   * Log un succès
   */
  static async success(
    event_type: LogEventType,
    subscription_id?: string,
    details?: Record<string, any>,
    context?: Partial<SubscriptionLogData>
  ): Promise<void> {
    return this.log({
      event_type,
      status: 'success',
      subscription_id,
      details,
      ...context
    })
  }

  /**
   * Log une erreur
   */
  static async error(
    event_type: LogEventType,
    error: Error | string,
    subscription_id?: string,
    details?: Record<string, any>,
    context?: Partial<SubscriptionLogData>
  ): Promise<void> {
    return this.log({
      event_type,
      status: 'error',
      subscription_id,
      error_message: typeof error === 'string' ? error : error.message,
      details: {
        ...details,
        stack: typeof error === 'object' ? error.stack : undefined
      },
      ...context
    })
  }

  /**
   * Log un warning
   */
  static async warning(
    event_type: LogEventType,
    message: string,
    subscription_id?: string,
    details?: Record<string, any>,
    context?: Partial<SubscriptionLogData>
  ): Promise<void> {
    return this.log({
      event_type,
      status: 'warning',
      subscription_id,
      error_message: message,
      details,
      ...context
    })
  }

  /**
   * Log une info
   */
  static async info(
    event_type: LogEventType,
    subscription_id?: string,
    details?: Record<string, any>,
    context?: Partial<SubscriptionLogData>
  ): Promise<void> {
    return this.log({
      event_type,
      status: 'info',
      subscription_id,
      details,
      ...context
    })
  }
}

/**
 * Helpers pour logger depuis les API routes
 */
export const logSubscriptionEvent = SubscriptionLogger.log
export const logSuccess = SubscriptionLogger.success
export const logError = SubscriptionLogger.error
export const logWarning = SubscriptionLogger.warning
export const logInfo = SubscriptionLogger.info

