import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * GET /api/platform/companies
 * Liste toutes les entreprises clientes (exclut la plateforme)
 */
export async function GET() {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, email, phone, address, city, postal_code, country, siret, vat_number, created_at, updated_at')
      .neq('id', platformId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Éviter les doublons : garder uniquement la plus ancienne entreprise par nom
    const uniqueCompanies = new Map<string, typeof companies[0]>()
    if (companies) {
      const sortedCompanies = [...companies].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      
      for (const company of sortedCompanies) {
        const key = company.name.toLowerCase().trim()
        if (!uniqueCompanies.has(key)) {
          uniqueCompanies.set(key, company)
        }
      }
    }

    return NextResponse.json({ companies: Array.from(uniqueCompanies.values()) })
  } catch (error) {
    console.error('Error in GET /api/platform/companies:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}









