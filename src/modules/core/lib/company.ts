/**
 * Module Core - Gestion des entreprises
 * Gestion multi-tenant avec isolation des données
 */

import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export interface Company {
  id: string
  name: string
  siret?: string
  vatNumber?: string
  address?: string
  city?: string
  zipCode?: string
  country: string
  currency: string
  timezone: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Récupérer l'entreprise de l'utilisateur actuel
 */
export async function getCurrentCompany(userId: string): Promise<Company | null> {
  const { data: user } = await supabase
    .from('users')
    .select('companyId')
    .eq('id', userId)
    .single()

  if (!user?.companyId) return null

  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', user.companyId)
    .single()

  if (error || !company) return null

  return company as Company
}

/**
 * Vérifier que l'utilisateur appartient à l'entreprise
 * (Sécurité multi-tenant)
 */
export async function verifyCompanyAccess(
  userId: string,
  companyId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('companyId')
    .eq('id', userId)
    .eq('companyId', companyId)
    .single()

  return !error && !!data
}

/**
 * Mettre à jour les informations de l'entreprise
 */
export async function updateCompany(
  companyId: string,
  updates: Partial<Company>
): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select()
    .single()

  if (error) throw error
  return data as Company
}

