/**
 * Helpers pour Supabase
 * Fonctions utilitaires pour faciliter les opérations avec Supabase
 */

/**
 * Ajoute automatiquement createdAt et updatedAt à un objet d'insertion
 * Utile car Supabase ne gère pas automatiquement les @default(now()) de Prisma
 */
export function addTimestamps<T extends Record<string, any>>(data: T): T & { createdAt: string; updatedAt: string } {
  const now = new Date().toISOString()
  return {
    ...data,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Génère un ID unique au format similaire à cuid
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

