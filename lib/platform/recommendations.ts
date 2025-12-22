/**
 * Module de recommandations automatiques basées sur le questionnaire
 */

export interface QuestionnaireData {
  request_type?: string
  business_sector?: string
  business_size?: string
  current_tools?: string[]
  main_needs?: string[]
  budget_range?: string
  timeline?: string
  additional_info?: string
}

export interface Recommendations {
  modules: string[]
  trial_config: {
    type: 'full_access' | 'limited' | 'custom'
    duration_days: number
    enabled_modules: string[]
  }
  next_step: 'interview' | 'trial' | 'contact'
}

/**
 * Recommande les modules selon les réponses du questionnaire
 */
export function recommendModules(questionnaire: QuestionnaireData): string[] {
  const recommendations: Set<string> = new Set()
  
  // Modules de base toujours recommandés
  recommendations.add('facturation')
  recommendations.add('crm')
  
  // Recommandations selon le secteur d'activité
  const sectorModules: Record<string, string[]> = {
    'commerce': ['stock', 'facturation', 'crm', 'reporting'],
    'restauration': ['stock', 'rh', 'projets', 'facturation'],
    'immobilier': ['documents', 'crm', 'projets', 'comptabilite'],
    'sante': ['documents', 'crm', 'rh', 'projets'],
    'education': ['documents', 'rh', 'projets', 'reporting'],
    'transport': ['stock', 'projets', 'rh', 'facturation'],
    'conseil': ['documents', 'projets', 'crm', 'reporting'],
    'autre': ['facturation', 'crm', 'documents'],
  }
  
  if (questionnaire.business_sector && sectorModules[questionnaire.business_sector]) {
    sectorModules[questionnaire.business_sector].forEach(module => {
      recommendations.add(module)
    })
  }
  
  // Recommandations selon les besoins exprimés
  if (questionnaire.main_needs) {
    const needsMapping: Record<string, string> = {
      'gestion_stock': 'stock',
      'stock': 'stock',
      'inventaire': 'stock',
      'facturation': 'facturation',
      'devis': 'facturation',
      'factures': 'facturation',
      'paie': 'rh',
      'rh': 'rh',
      'salaires': 'rh',
      'employes': 'rh',
      'comptabilite': 'comptabilite',
      'compta': 'comptabilite',
      'crm': 'crm',
      'clients': 'crm',
      'contacts': 'crm',
      'projets': 'projets',
      'project': 'projets',
      'documents': 'documents',
      'reporting': 'reporting',
      'statistiques': 'reporting',
      'analytics': 'reporting',
    }
    
    questionnaire.main_needs.forEach(need => {
      const normalizedNeed = need.toLowerCase().trim()
      if (needsMapping[normalizedNeed]) {
        recommendations.add(needsMapping[normalizedNeed])
      }
    })
  }
  
  // Recommandations selon la taille de l'entreprise
  if (questionnaire.business_size) {
    if (questionnaire.business_size === 'grande_entreprise') {
      recommendations.add('reporting')
      recommendations.add('projets')
    }
  }
  
  return Array.from(recommendations)
}

/**
 * Génère les recommandations complètes avec configuration de l'essai
 */
export function generateRecommendations(questionnaire: QuestionnaireData): Recommendations {
  const modules = recommendModules(questionnaire)
  
  // Déterminer le type d'essai
  let trialType: 'full_access' | 'limited' | 'custom' = 'custom'
  if (questionnaire.request_type === 'trial_7days') {
    trialType = 'full_access'
  } else if (modules.length <= 4) {
    trialType = 'limited'
  }
  
  // Durée fixe de 7 jours pour tous les essais gratuits
  const durationDays = 7
  
  // Déterminer la prochaine étape
  let nextStep: 'interview' | 'trial' | 'contact' = 'interview'
  if (questionnaire.request_type === 'trial_7days' && modules.length > 0) {
    nextStep = 'trial'
  } else if (questionnaire.budget_range === '<100' || questionnaire.request_type === 'company_creation') {
    nextStep = 'contact'
  }
  
  return {
    modules,
    trial_config: {
      type: trialType,
      duration_days: durationDays,
      enabled_modules: modules,
    },
    next_step: nextStep,
  }
}

