import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, type SendEmailOptions } from '@/lib/services/email'

/**
 * API Route pour envoyer un email générique
 * POST /api/email/send
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendEmailOptions = await request.json()

    // Validation basique
    if (!body.to || !body.subject) {
      return NextResponse.json(
        { error: 'Les champs "to" et "subject" sont obligatoires' },
        { status: 400 }
      )
    }

    // Envoyer l'email
    const result = await sendEmail(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('Error in /api/email/send:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    )
  }
}


