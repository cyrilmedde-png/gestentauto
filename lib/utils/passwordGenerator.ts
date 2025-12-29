/**
 * Générateur de mots de passe sécurisés
 */

export interface PasswordOptions {
  length?: number
  includeUppercase?: boolean
  includeLowercase?: boolean
  includeNumbers?: boolean
  includeSpecial?: boolean
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS = '0123456789'
const SPECIAL = '!@#$%^&*'

/**
 * Génère un mot de passe aléatoire sécurisé
 * @param options Options de génération
 * @returns Mot de passe généré
 */
export function generateSecurePassword(options: PasswordOptions = {}): string {
  const {
    length = 12,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSpecial = true,
  } = options

  if (length < 8) {
    throw new Error('Le mot de passe doit faire au moins 8 caractères')
  }

  let chars = ''
  let password = ''

  // Ajouter les types de caractères sélectionnés
  if (includeUppercase) chars += UPPERCASE
  if (includeLowercase) chars += LOWERCASE
  if (includeNumbers) chars += NUMBERS
  if (includeSpecial) chars += SPECIAL

  if (chars.length === 0) {
    throw new Error('Au moins un type de caractère doit être sélectionné')
  }

  // Garantir au moins 1 caractère de chaque type sélectionné
  if (includeUppercase) {
    password += UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)]
  }
  if (includeLowercase) {
    password += LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]
  }
  if (includeNumbers) {
    password += NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
  }
  if (includeSpecial) {
    password += SPECIAL[Math.floor(Math.random() * SPECIAL.length)]
  }

  // Compléter avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }

  // Mélanger le mot de passe pour éviter un pattern prévisible
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Vérifie la force d'un mot de passe
 * @param password Mot de passe à vérifier
 * @returns Score de 0 (faible) à 4 (très fort)
 */
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string
} {
  let score = 0
  const feedback: string[] = []

  // Longueur
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  else feedback.push('Utilisez au moins 12 caractères')

  // Majuscules
  if (/[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('Ajoutez des lettres majuscules')
  }

  // Minuscules
  if (/[a-z]/.test(password)) {
    score++
  } else {
    feedback.push('Ajoutez des lettres minuscules')
  }

  // Chiffres
  if (/[0-9]/.test(password)) {
    score++
  } else {
    feedback.push('Ajoutez des chiffres')
  }

  // Caractères spéciaux
  if (/[!@#$%^&*]/.test(password)) {
    score++
  } else {
    feedback.push('Ajoutez des caractères spéciaux (!@#$%^&*)')
  }

  // Normaliser le score sur 4
  const normalizedScore = Math.min(Math.floor((score / 6) * 4), 4)

  const messages = [
    'Très faible',
    'Faible',
    'Moyen',
    'Fort',
    'Très fort',
  ]

  return {
    score: normalizedScore,
    feedback: feedback.length > 0 ? feedback.join('. ') : messages[normalizedScore],
  }
}

/**
 * Valide si un mot de passe respecte les critères minimums
 * @param password Mot de passe à valider
 * @returns true si valide, sinon un message d'erreur
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Le mot de passe est requis' }
  }

  if (password.length < 8) {
    return { valid: false, error: 'Le mot de passe doit faire au moins 8 caractères' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins une majuscule' }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins une minuscule' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins un chiffre' }
  }

  if (!/[!@#$%^&*]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)' }
  }

  return { valid: true }
}

