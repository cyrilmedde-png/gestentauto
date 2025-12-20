import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

/**
 * POST /api/platform/onboarding
 * Créer un nouveau client (entreprise + utilisateur admin)
 * Cette route est utilisée par la plateforme pour créer de nouveaux clients
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { 
      companyName, 
      companyEmail, 
      companyPhone,
      companyAddress,
      companyCity,
      companyPostalCode,
      companyCountry,
      companySiret,
      companyVatNumber,
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
    } = body

    // Validation des champs requis
    if (!companyName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'companyName, adminEmail, and adminPassword are required' },
        { status: 400 }
      )
    }

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirmer l'email
      user_metadata: {
        first_name: adminFirstName || null,
        last_name: adminLastName || null,
      },
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // 2. Créer l'entreprise
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        email: companyEmail || null,
        phone: companyPhone || null,
        address: companyAddress || null,
        city: companyCity || null,
        postal_code: companyPostalCode || null,
        country: companyCountry || 'FR',
        siret: companySiret || null,
        vat_number: companyVatNumber || null,
      })
      .select()
      .single()

    if (companyError || !companyData) {
      // Nettoyage : supprimer l'utilisateur Auth créé
      try {
        await supabase.auth.admin.deleteUser(userId)
      } catch {}
      
      return NextResponse.json(
        { error: companyError?.message || 'Failed to create company' },
        { status: 500 }
      )
    }

    // 3. Créer l'entrée utilisateur dans la table users
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        company_id: companyData.id,
        email: adminEmail,
        first_name: adminFirstName || null,
        last_name: adminLastName || null,
      })

    if (userError) {
      // Nettoyage : supprimer l'entreprise et l'utilisateur Auth
      try {
        await supabase.from('companies').delete().eq('id', companyData.id)
      } catch {}
      try {
        await supabase.auth.admin.deleteUser(userId)
      } catch {}
      
      return NextResponse.json(
        { error: userError.message || 'Failed to create user record' },
        { status: 500 }
      )
    }

    // 4. Créer un rôle admin par défaut pour l'entreprise
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .insert({
        company_id: companyData.id,
        name: 'Admin',
        permissions: {
          all_modules: true,
          users: { read: true, write: true, delete: true, create: true },
          settings: { read: true, write: true },
        },
      })
      .select()
      .single()

    if (roleError) {
      console.error('Error creating admin role:', roleError)
      // On continue quand même, le rôle pourra être créé plus tard
    }

    // 5. Assigner le rôle admin à l'utilisateur si créé
    if (adminRole) {
      try {
        await supabase
          .from('users')
          .update({ role_id: adminRole.id })
          .eq('id', userId)
      } catch {}
    }

    return NextResponse.json(
      {
        success: true,
        company: companyData,
        user: {
          id: userId,
          email: adminEmail,
          first_name: adminFirstName,
          last_name: adminLastName,
        },
        role: adminRole || null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/platform/onboarding:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

