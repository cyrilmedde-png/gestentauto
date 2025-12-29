import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { type, title, message, data } = await request.json()

    if (!type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Type, title et message sont requis' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Récupérer tous les utilisateurs admin
    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('id')
      .eq('user_type', 'admin')

    if (adminsError) {
      console.error('Erreur lors de la récupération des admins:', adminsError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des admins' },
        { status: 500 }
      )
    }

    if (!admins || admins.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun admin trouvé' },
        { status: 404 }
      )
    }

    // Créer une notification pour chaque admin
    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      type,
      title,
      message,
      data,
      read: false,
      created_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (insertError) {
      console.error('Erreur lors de la création des notifications:', insertError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création des notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${admins.length} notification(s) créée(s)`,
    })
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Vérifier que l'utilisateur est connecté
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les notifications de l'utilisateur
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (notifError) {
      console.error('Erreur lors de la récupération des notifications:', notifError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unread_count: notifications?.filter((n) => !n.read).length || 0,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { notification_id } = await request.json()

    if (!notification_id) {
      return NextResponse.json(
        { success: false, error: 'notification_id est requis' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Marquer la notification comme lue
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification_id)

    if (updateError) {
      console.error('Erreur lors de la mise à jour de la notification:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour de la notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marquée comme lue',
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

