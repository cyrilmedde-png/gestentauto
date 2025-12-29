/**
 * Types pour le module d'onboarding
 */

export type LeadStatus = 'pre_registered' | 'questionnaire_completed' | 'interview_scheduled' | 'trial_started' | 'converted' | 'abandoned'

export type OnboardingStep = 'form' | 'questionnaire' | 'interview' | 'trial' | 'completed'

export type InterviewStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export type TrialStatus = 'active' | 'expired' | 'converted' | 'cancelled'

export type TrialType = 'full_access' | 'limited' | 'custom'

export interface LeadUpdate {
  status?: LeadStatus
  onboarding_step?: OnboardingStep
  email?: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  company_name?: string | null
}

export interface InterviewUpdate {
  scheduled_at?: string
  status?: InterviewStatus
  meeting_link?: string | null
  notes?: string | null
  interviewer_id?: string | null
}

export interface RoleUpdate {
  name?: string
  permissions?: Record<string, unknown>
}

export interface UserUpdate {
  first_name?: string | null
  last_name?: string | null
  role_id?: string | null
}

export interface SettingUpdate {
  value?: unknown
}







