import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createPlatformClient } from '@/lib/supabase/platform'

/**
 * GET /api/auth/debug-user-type
 * Route de debug pour vérifier le type d'utilisateur avec tous les détails
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const platformSupabase = createPlatformClient()
    
    // Vérifier l'authentification
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json({
        error: 'Not authenticated',
        authError: authError?.message,
      }, { status: 401 })
    }

    // Récupérer les données utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, company_id, email, first_name, last_name')
      .eq('id', authUser.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({
        error: 'User not found',
        userError: userError?.message,
        userId: authUser.id,
      }, { status: 404 })
    }

    // Récupérer le platform_company_id depuis les settings
    const { data: platformSetting, error: platformSettingError } = await platformSupabase
      .from('settings')
      .select('value, company_id')
      .eq('key', 'platform_company_id')
      .limit(1)
      .maybeSingle()

    // Extraire la valeur JSONB
    let platformId: string | null = null
    if (platformSetting) {
      const value = platformSetting.value
      if (typeof value === 'string') {
        platformId = value.trim()
      } else if (typeof value === 'object' && value !== null) {
        // Essayer différentes méthodes d'extraction
        try {
          platformId = JSON.stringify(value).replace(/^"|"$/g, '').trim()
        } catch (e) {
          platformId = String(value).trim()
        }
      }
    }

    // Normaliser pour comparaison
    const normalizedUserCompanyId = String(userData.company_id).trim().toLowerCase()
    const normalizedPlatformId = platformId ? String(platformId).trim().toLowerCase() : null
    const isPlatform = normalizedPlatformId === normalizedUserCompanyId

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        company_id: userData.company_id,
        company_id_normalized: normalizedUserCompanyId,
        company_id_type: typeof userData.company_id,
      },
      platform: {
        setting_found: !!platformSetting,
        setting_error: platformSettingError?.message,
        raw_value: platformSetting?.value,
        extracted_platform_id: platformId,
        normalized_platform_id: normalizedPlatformId,
        platform_id_type: typeof platformId,
      },
      comparison: {
        are_equal: isPlatform,
        user_company_id: normalizedUserCompanyId,
        platform_id: normalizedPlatformId,
      },
      result: {
        isPlatform,
        should_have_access: isPlatform,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/auth/debug-user-type:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}

